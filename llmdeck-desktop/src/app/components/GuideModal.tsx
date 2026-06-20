import { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { incrAppOpenTimes } from '~services/storage/open-times'
import Button from './Button'
import Dialog from './Dialog'

const PROJECT_URL = 'https://github.com/moyuer666666/LLMDeck'

const GuideModal: FC = () => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [openTimes, setOpenTimes] = useState(0)

  const openProjectPage = () => {
    setOpen(false)
    if (window.electronAPI?.openExternal) {
      void window.electronAPI.openExternal(PROJECT_URL)
      return
    }
    window.open(PROJECT_URL, '_blank', 'noopener,noreferrer')
  }

  useEffect(() => {
    incrAppOpenTimes().then((t) => {
      if (t === 15) {
        setOpen(true)
      }
      setOpenTimes(t)
    })
  }, [])

  if (openTimes === 15) {
    return (
      <Dialog title={t('Recommend LLMDeck')} open={open} onClose={() => setOpen(false)} className="rounded-2xl w-[600px]">
        <div className="flex flex-col items-center gap-4 py-6">
          <p className="font-semibold text-primary-text">{t('Enjoy LLMDeck? Recommend it to others!')}</p>
          <Button text={t('Open project page')} onClick={openProjectPage} />
        </div>
      </Dialog>
    )
  }

  return null
}

export default GuideModal
