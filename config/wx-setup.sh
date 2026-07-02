#!/bin/bash
# 微信公众号菜单配置脚本
# 用法: bash config/wx-setup.sh <APPID> <APPSECRET>

APPID=$1
APPSECRET=$2

if [ -z "$APPID" ] || [ -z "$APPSECRET" ]; then
  echo "用法: bash config/wx-setup.sh <APPID> <APPSECRET>"
  exit 1
fi

echo "=== 微信公众号配置脚本 ==="

# 1. 获取 access_token
echo ""
echo ">>> 获取 access_token..."
TOKEN_RESP=$(curl -s "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${APPSECRET}")
ACCESS_TOKEN=$(echo $TOKEN_RESP | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ 获取 access_token 失败: $TOKEN_RESP"
  exit 1
fi
echo "✅ access_token 获取成功"

# 2. 创建自定义菜单
echo ""
echo ">>> 创建自定义菜单..."
MENU_RESP=$(curl -s -X POST "https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d @config/wx-menu.json)
ERRCODE=$(echo $MENU_RESP | python3 -c "import sys,json; print(json.load(sys.stdin).get('errcode',-1))")

if [ "$ERRCODE" = "0" ]; then
  echo "✅ 菜单创建成功！"
else
  echo "❌ 菜单创建失败: $MENU_RESP"
fi

# 3. 查询当前菜单
echo ""
echo ">>> 查询当前菜单..."
curl -s "https://api.weixin.qq.com/cgi-bin/menu/get?access_token=${ACCESS_TOKEN}" | python3 -m json.tool

echo ""
echo "=== 配置完成 ==="
echo "注意：菜单更新后需要24小时才会对所有用户生效"
echo "如需立即生效，可取消关注后重新关注"
