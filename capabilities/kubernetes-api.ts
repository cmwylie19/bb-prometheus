import {
  KubeConfig,
  CustomObjectsApi,
} from "@kubernetes/client-node";
import { IServiceMonitor, IPrometheusRule } from "./api-types"

export class K8sAPI {
  customK8s: CustomObjectsApi

  constructor() {
    const kc = new KubeConfig();
    kc.loadFromDefault();
    this.customK8s = kc.makeApiClient(CustomObjectsApi)
  }

  async createPrometheusRule(name: string, namespace: string, container: string) {
    try {
      const prometheusRule: IPrometheusRule = {
        apiVersion: 'monitoring.coreos.com/v1',
        kind: 'PrometheusRule',
        metadata: {
          name: name,
          namespace: namespace,
        },
        spec: {
          groups: [{
            name: "alert-definitions",
            rules: [{
              alert: `${name}_is_down`,
              expr: `absent(up{container="${container}"} == 1)`,
              for: "3s",
              labels: {
                severity: "page"
              },
              annotations: {
                summary: `${name} went down for 3 seconds.`,
                description: "Check the pods!"
              }
            }]
          }]
        },
      };
      await this.customK8s.createNamespacedCustomObject(
        "monitoring.coreos.com",
        "v1",
        namespace,
        "prometheusrules",
        prometheusRule
      )
    } catch (err) {
      return err
    }
  }


  async createServiceMonitor(name: string, namespace: string, labels: Record<string, string>, port: string, scheme?: string) {
    let tlsConfig = {}
    if (scheme === "https") {
      // https://docs-bigbang.dso.mil/latest/packages/monitoring/docs/istio-mtls-metrics/#ServiceMonitor-Config
      tlsConfig = {
          caFile: "/etc/prom-certs/root-cert.pem",
          certFile: "/etc/prom-certs/cert-chain.pem",
          keyFile: "/etc/prom-certs/key.pem",
          insecureSkipVerify: true
        }
    } else {
      scheme = "http"
    }
    try {
      const serviceMonitor: IServiceMonitor = {
        apiVersion: 'monitoring.coreos.com/v1',
        kind: 'ServiceMonitor',
        metadata: {
          name: name,
          namespace: namespace,
        },
        spec: {
          selector: {
            matchLabels: labels
          },
          endpoints: [{
            port: port,
            scheme: scheme,
            tlsConfig: tlsConfig
          }]
        },
      };
      await this.customK8s.createNamespacedCustomObject(
        "monitoring.coreos.com",
        "v1",
        namespace,
        "servicemonitors",
        serviceMonitor
      )
    } catch (err) {
      return err
    }
  }
}
