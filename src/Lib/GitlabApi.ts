import axios from 'axios'

export type 仓库返回类型 = {
  name: string
  visibility: string
  id: string
  http_url_to_repo: string
  path: string
}
export async function 获得用户仓库信息(令牌: string, 仓库排序选项: string,网址:string): Promise<仓库返回类型[]> {
  console.log(`${网址}/api/v4/projects?private_token=${令牌}&sort=${仓库排序选项}&per_page=99999`)
  var c = await axios.get(
    `${网址}/api/v4/projects?private_token=${令牌}&sort=${仓库排序选项}&per_page=99999`
  )
  return c.data
}

export async function 获得用户资料(令牌: string,网址:string) {
  var c = await axios.get(`${网址}/api/v4/user?private_token=${令牌}`)
  return c.data
}

export async function 创建仓库(令牌: string, 名称: string) {
  var c = await axios.post('https://gitee.com/api/v5/user/repos', {
    access_token: 令牌,
    name: 名称,
    private: 'true',
  })
  return c.data
}

export async function 修改仓库名称(令牌: string, 用户名: string, 路径: string, 新名称: string) {
  var c = await axios.patch(`https://gitee.com/api/v5/repos/${用户名}/${路径}`, {
    access_token: 令牌,
    name: 新名称,
  })
  return c.data
}

export type 通知返回类型 = { list: { content: string; http_url_to_repo: string; unread: boolean; id: number }[] }
export async function 获得用户通知(令牌: string): Promise<通知返回类型> {
  var c = await axios.get(
    `https://gitee.com/api/v5/notifications/threads?access_token=${令牌}&type=all&page=1&per_page=20`,
  )
  return c.data
}

export async function 翻译(s: string) {
  var c = await axios.get(`https://gitee.com/search/translate?q=${encodeURI(s)}`)
  return c.data.result
}
