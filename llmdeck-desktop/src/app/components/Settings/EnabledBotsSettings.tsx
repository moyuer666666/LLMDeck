import { FC, useCallback, useState } from 'react'
import { UserConfig, Chatbot } from '~services/user-config'
import { getFaviconUrl, uuid } from '~/utils'
import { Input } from '../Input'
import Button from '../Button'
import { FiEdit2, FiTrash2, FiPlus, FiCheck, FiX } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

interface Props {
  userConfig: UserConfig
  updateConfigValue: (update: Partial<UserConfig>) => void
}

const EnabledBotsSettings: FC<Props> = ({ userConfig, updateConfigValue }) => {
  const { t } = useTranslation()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editUrl, setEditUrl] = useState('')

  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')

  const startEdit = useCallback((bot: Chatbot) => {
    setEditingId(bot.id)
    setEditName(bot.name)
    setEditUrl(bot.url)
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
  }, [])

  const saveEdit = useCallback(() => {
    if (!editName.trim() || !editUrl.trim()) {
      alert('Name and URL are required')
      return
    }
    let formattedUrl = editUrl.trim()
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl
    }
    const updated = userConfig.chatbots.map((bot) => {
      if (bot.id === editingId) {
        return { ...bot, name: editName.trim(), url: formattedUrl }
      }
      return bot
    })
    updateConfigValue({ chatbots: updated })
    setEditingId(null)
  }, [editName, editUrl, editingId, updateConfigValue, userConfig.chatbots])

  const deleteBot = useCallback((id: string) => {
    if (userConfig.chatbots.length <= 1) {
      alert('At least one chatbot is required')
      return
    }
    if (window.confirm('Are you sure you want to delete this chatbot?')) {
      const updated = userConfig.chatbots.filter((bot) => bot.id !== id)
      updateConfigValue({ chatbots: updated })
    }
  }, [updateConfigValue, userConfig.chatbots])

  const addBot = useCallback(() => {
    if (!newName.trim() || !newUrl.trim()) {
      alert('Name and URL are required')
      return
    }
    let formattedUrl = newUrl.trim()
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl
    }
    const newBot: Chatbot = {
      id: uuid(),
      name: newName.trim(),
      url: formattedUrl,
    }
    updateConfigValue({ chatbots: [...userConfig.chatbots, newBot] })
    setNewName('')
    setNewUrl('')
    setIsAdding(false)
  }, [newName, newUrl, updateConfigValue, userConfig.chatbots])

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-2.5 max-w-[650px] border border-solid border-primary-border rounded-xl p-4 bg-secondary bg-opacity-10 backdrop-blur">
        {userConfig.chatbots.map((bot) => {
          const isEditing = editingId === bot.id
          return (
            <div
              key={bot.id}
              className="flex flex-row items-center justify-between gap-3 p-3 rounded-lg bg-primary-background bg-opacity-40 border border-solid border-primary-border hover:border-gray-500 transition duration-200"
            >
              {isEditing ? (
                <div className="flex flex-col md:flex-row gap-2 w-full">
                  <Input
                    className="grow md:w-1/4"
                    placeholder="名称"
                    value={editName}
                    onChange={(e) => setEditName(e.currentTarget.value)}
                  />
                  <Input
                    className="grow md:w-3/5"
                    placeholder="网址 (例如: https://...)"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.currentTarget.value)}
                  />
                  <div className="flex flex-row gap-2 ml-auto">
                    <button
                      onClick={saveEdit}
                      className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition"
                      title={t('Save')}
                    >
                      <FiCheck size={16} />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition"
                      title={t('Cancel')}
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-row items-center gap-3 overflow-hidden">
                    <img
                      src={getFaviconUrl(bot.url)}
                      className="w-5 h-5 object-contain rounded-sm"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="gray" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>'
                      }}
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-primary-text">{bot.name}</span>
                      <span className="text-xs text-secondary-text opacity-70 truncate max-w-[320px]">{bot.url}</span>
                    </div>
                  </div>
                  <div className="flex flex-row gap-2">
                    <button
                      onClick={() => startEdit(bot)}
                      className="p-2 hover:bg-secondary hover:bg-opacity-20 text-primary-text rounded-md transition"
                      title={t('Edit')}
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteBot(bot.id)}
                      className="p-2 hover:bg-red-500 hover:text-white text-red-400 rounded-md transition"
                      title={t('Delete')}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}

        {isAdding ? (
          <div className="flex flex-col gap-3 p-3 rounded-lg border border-dashed border-gray-400 bg-secondary bg-opacity-5 mt-2">
            <p className="text-xs font-semibold text-secondary-text">添加新的机器人</p>
            <div className="flex flex-col gap-2">
              <Input
                placeholder="例如: DeepSeek"
                value={newName}
                onChange={(e) => setNewName(e.currentTarget.value)}
              />
              <Input
                placeholder="例如: https://chat.deepseek.com"
                value={newUrl}
                onChange={(e) => setNewUrl(e.currentTarget.value)}
              />
            </div>
            <div className="flex flex-row gap-2 justify-end mt-1">
              <Button
                size="small"
                text="确定"
                onClick={addBot}
                className="bg-indigo-600 text-white hover:bg-indigo-700 py-1"
              />
              <Button
                size="small"
                text="取消"
                onClick={() => setIsAdding(false)}
                className="bg-transparent border border-solid border-primary-border hover:bg-secondary hover:bg-opacity-20 py-1"
              />
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex flex-row items-center justify-center gap-2 p-2 border border-dashed border-gray-400 rounded-lg hover:border-indigo-500 hover:text-indigo-500 transition duration-200 mt-2 text-sm font-medium text-secondary-text"
          >
            <FiPlus size={16} />
            <span>添加机器人 (Add Chatbot)</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default EnabledBotsSettings
