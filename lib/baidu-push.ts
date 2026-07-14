// 百度主动推送工具
// 资产发布/更新时自动通知百度来抓取

const BAIDU_PUSH_URL = 'http://data.zz.baidu.com/urls?site=https://zjd.cn&token=09N5zmLNYP67hzX7';

/**
 * 向百度推送 URL
 * @param urls 要推送的 URL 列表
 */
export async function baiduPush(urls: string[]): Promise<{ success: boolean; result?: any; error?: string }> {
  if (!urls.length) return { success: true };

  try {
    const res = await fetch(BAIDU_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: urls.join('\n'),
    });
    const data = await res.json() as any;
    return { success: true, result: data };
  } catch (error: any) {
    console.warn('百度推送失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 推送单个资产页面
 */
export async function baiduPushAsset(assetId: number): Promise<void> {
  await baiduPush([`https://zjd.cn/asset/${assetId}`]);
}

/**
 * 推送单个大宗项目页面
 */
export async function baiduPushBulkProject(projectId: number): Promise<void> {
  await baiduPush([`https://zjd.cn/bulk-projects/${projectId}`]);
}
