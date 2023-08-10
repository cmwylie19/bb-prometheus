import {
  Capability,
  Log,
  a,
} from "pepr";
import { K8sAPI } from "./kubernetes-api";
/**
 *  The Prometheus Capability creates ServiceMonitors and PrometheusRules
 *  for Services that are labels with prometheus=scrape.
 *  The labels the capability expects are:
 *  - container=container_to_watch
 *  - scrape-port=port_to_scrape
 */
export const Prometheus = new Capability({
  name: "prometheus",
  description: "Creates ServiceMonitors and PrometheusRules.",
  namespaces: [],
});

// Use the 'When' function to create a new Capability Action
const { When } = Prometheus;
const k8sAPI = new K8sAPI()

When(a.Service)
  .IsCreated()
  .WithLabel("prometheus", "scrape")
  .Then(async svc => {
    const { name, namespace, labels } = svc.Raw?.metadata
    const { selector } = svc.Raw?.spec
    try {
      await Promise.all([k8sAPI.createServiceMonitor(
        name,
        namespace,
        selector,
        labels['scrape-port']
      ),
      k8sAPI.createPrometheusRule(
        name,
        namespace,
        labels['container']
      )])
      
      Log.info(`Created ServiceMonitor and PrometheusRule ${name} in ${namespace}`)
  }
    catch (err) {
      Log.error(`Failed to created ServiceMonitor and PrometheusRule ${name} in ${namespace}`)
    }
  })
  