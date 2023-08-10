import { V1ObjectMeta } from "@kubernetes/client-node";


interface Endpoint {
    port: string;
    path?: string;
    interval?: string;
  }
  
  interface Selector {
    matchLabels: Record<string, string>;
  }
  
  interface ServiceMonitorSpec {
    endpoints: Endpoint[];
    selector: Selector;
  }
  
  interface Rule {
    alert: string;
    expr: string;
    for?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  }
  
  interface PrometheusRuleSpec {
    groups: {
      name: string;
      rules: Rule[];
    }[];
  }
  

export interface IServiceMonitor {
    apiVersion: string;
    kind: 'ServiceMonitor';
    metadata: V1ObjectMeta;
    spec: ServiceMonitorSpec;
}

export interface IPrometheusRule {
    apiVersion: string;
    kind: 'PrometheusRule';
    metadata: V1ObjectMeta;
    spec: PrometheusRuleSpec;
}
