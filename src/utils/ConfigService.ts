import featureFlags from '../config/feature-flags.json'
import { RuntimeConfig } from './RuntimeConfig'
import thresholds from '../config/quality-thresholds.json'
import perf from '../config/performance-budget.json'

export class ConfigService {
  getFeatureFlags() { const rt = RuntimeConfig.load(); return { ...featureFlags, ...rt } }
  getQualityThresholds() { return thresholds }
  getPerformanceBudget() { return perf }
}
