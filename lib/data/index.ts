// lib/data/index.ts — 统一导出入口
// 所有 import { ... } from '@/lib/data' 自动路由到子模块

// 首页配置
export { getHomepageConfig, getConfigValue, getConfigCount } from './config';

// 资产
export {
  getAssets, getAssetsCount, getAssetById,
  getHotAssets, getFeaturedAssets, getAssetsBySource, getLatestAssets,
  getAssetsByProvince, getAssetStats, searchAssets, incrementViews,
  type Asset, type AssetFilters,
} from './assets';

// 合伙人
export {
  getBrokers, getBrokersFiltered, getBrokersCount, getBrokerById,
  getBrokerProvinces, getBrokerCities,
  type Broker, type BrokerFilters,
} from './brokers';

// 大宗路演
export {
  getBulkProjects, getBulkProjectsCount, getBulkProjectById,
  getFeaturedBulkProjects, incrementBulkViews,
  type BulkProject, type BulkProjectFilters,
} from './bulk-projects';

// 行情 + 基建
export {
  getMarketData, getMarketDataByProvince,
  getInfraRatings, getInfraRatingById,
  type MarketData, type InfraRating,
} from './market';

// 行政区划 + 资产类型
export {
  getRegionsByLevel, getProvinceEmoji, getAllProvinceEmojis,
  getAssetTypes,
  type Region, type AssetType,
} from './regions';

// 发布者
export {
  getPublisherProfile, getPublisherAssets, getPublisherAssetCount,
  type PublisherProfile,
} from './publisher';
