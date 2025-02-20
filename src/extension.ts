import * as vscode from 'vscode'
import { 用户配置, 获得用户配置 } from './Lib/Config'
import {
  仓库返回类型,
  修改仓库名称,
  创建仓库,
  翻译,
  获得用户仓库信息,
  获得用户资料,
  获得用户通知,
  通知返回类型,
} from './Lib/GitlabApi'
import { 插件名称 } from './Lib/NAME'
import { 当配置修改时, 执行命令, 提示, 注册命令, 设置树数据 } from './Lib/VsCodeApi'
import opn from 'open'
import path from 'path'
import { existsSync } from 'fs'
import mkdirp from 'mkdirp'
import gitClone from 'git-clone'
import openExplorer from 'open-file-explorer'
import clipboardy from 'clipboardy'
import { Y } from './Lib/Lib'


export async function activate(context: vscode.ExtensionContext) {
  console.log(`"${插件名称}" 已启动`)

  var 用户配置: 用户配置 = 获得用户配置()
  if (用户配置.令牌 == null || 用户配置.令牌 == '') {
    throw new Error('未配置令牌')
  }

  当配置修改时(() => {
    用户配置 = 获得用户配置()
  })

  var gitlab用户名 = (await 获得用户资料(用户配置.令牌,用户配置.gitlab网址)).name
  var 过滤条件 = ''

  // 注册命令(context, '刷新通知', async () => {
  //   try {
  //     设置树数据('my_itlab_info', [{ 显示文本: '加载中...' }], (a) => new vscode.TreeItem(a.显示文本))
  //     var 用户通知信息 = (await 获得用户通知(用户配置.令牌)).list
  //     设置树数据(
  //       'my_itlab_info',
  //       用户通知信息.map((a) => ({
  //         显示文本: (a.unread ? '[未]' : '[已]') + a.content,
  //         gitlab_id: a.id,
  //         http_url_to_repo: a.http_url_to_repo,
  //       })),
  //       (a) => new vscode.TreeItem(a.显示文本),
  //     )
  //   } catch (e: any) {
  //     提示('出错了: ' + e.toString())
  //   }
  // })
  注册命令(context, '打开通知在网页', async (a: 通知返回类型['list'][0]) => {
    try {
      await opn(a.http_url_to_repo)
    } catch (e: any) {
      提示('出错了: ' + e.toString())
    }
  })
  注册命令(context, '刷新仓库', async (_) => {
    try {
      var 显示数组: { 显示文本: string }[] = []
      if (过滤条件 != '') {
        显示数组 = [{ 显示文本: '※ 当前的过滤条件: ' + 过滤条件 }]
      }
      设置树数据('my_gitlab', [...显示数组, { 显示文本: '加载中...' }], (a) => new vscode.TreeItem(a.显示文本))
      var 用户仓库信息 = await 获得用户仓库信息(用户配置.令牌, 用户配置.仓库排序选项,用户配置.gitlab网址)
      设置树数据(
        'my_gitlab',
        [
          ...显示数组,
          ...用户仓库信息
              .filter((a) => a.name_with_namespace.toLowerCase().indexOf(过滤条件.toLowerCase()) != -1)
              .sort((a,b) => a.name_with_namespace.localeCompare(b.name_with_namespace))
              .map((a) => ({
              显示文本: (a.visibility == "private" ? '[私]' : '[公]') + a.name_with_namespace,
              gitlab_id: a.id,
              http_url_to_repo: a.http_url_to_repo,
              path: a.path,
            })),
        ],
        (a) => new vscode.TreeItem(a.显示文本),
      )
    } catch (e: any) {
      提示('出错了: ' + e.toString())
    }
  })
  注册命令(context, '过滤', async (_) => {
    try {
      var 输入 = await vscode.window.showInputBox({
        prompt: '请输入你要搜索的内容, 留空为不过滤.',
        placeHolder: '请输入你要搜索的内容, 留空为不过滤.',
        value: 过滤条件,
      })
      if (输入 == null || 过滤条件 == null) {
        return
      }
      过滤条件 = 输入.trim()
      await 执行命令('刷新仓库')
    } catch (e: any) {
      提示('出错了: ' + e.toString())
    }
  })
  注册命令(context, '下载仓库', async (a: 仓库返回类型) => {
    try {
      var 地址 = a.http_url_to_repo
      var 路径 = path.join(用户配置.下载位置, a.path)

      if (existsSync(路径)) {
        throw new Error(`路径 ${路径} 已存在`)
      }

      提示('开始下载到 ' + 路径)

      await mkdirp(路径)
      try {
        console.log(地址+"="+路径)
        await new Promise((res, rej) => gitClone(地址, 路径, {}, (err) => (err ? rej(err) : res(null))))
      } catch (e) {
        提示('出错了: ' + JSON.stringify(e))
        throw e
      }
      提示('已下载到 ' + 路径)
    } catch (e: any) {
      提示('出错了: ' + e.toString())
    }
  })
  注册命令(context, '打开在网页', async (a: 仓库返回类型) => {
    try {
      var 地址 = a.http_url_to_repo
      await opn(地址)
    } catch (e: any) {
      提示('出错了: ' + e.toString())
    }
  })
  注册命令(context, '打开在资源管理器', async (a: 仓库返回类型) => {
    try {
      var 路径 = path.join(用户配置.下载位置, a.path)
      if (!existsSync(路径)) {
        await 执行命令('下载仓库', a)
      }
      await openExplorer(路径)
    } catch (e: any) {
      提示('出错了: ' + e.toString())
    }
  })
  注册命令(context, '打开在vscode', async (a: 仓库返回类型) => {
    try {
      var 路径 = path.join(用户配置.下载位置, a.path)
      if (!existsSync(路径)) await 执行命令('下载仓库', a)
      await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(路径), true)
    } catch (e: any) {
      提示('出错了: ' + e.toString())
    }
  })
  注册命令(context, '复制仓库地址(https)', async (a: 仓库返回类型) => {
    try {
      var 地址 = a.http_url_to_repo
      clipboardy.writeSync(地址)
      提示('已复制到剪切板')
    } catch (e: any) {
      提示('出错了: ' + e.toString())
    }
  })

  执行命令('刷新仓库')
  // 执行命令('刷新通知')

  if (用户配置.通知自动刷新时间 != 0) {
    Y((s: any) =>
      setTimeout(async () => {
        await 执行命令('刷新通知')
        s(s)
      }, 用户配置.通知自动刷新时间 * 60 * 1000),
    )
  }
}

export function deactivate() {}
