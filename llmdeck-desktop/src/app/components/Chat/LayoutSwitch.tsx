import { cx } from '~/utils'
import { FC, ReactNode } from 'react'
import { Layout } from '~app/consts'
import layoutFourIcon from '~assets/icons/layout-four.svg'
import layoutThreeIcon from '~assets/icons/layout-three.svg'
import layoutTwoIcon from '~assets/icons/layout-two.svg'
import layoutSixIcon from '~assets/icons/layout-six.svg'

const Item: FC<{ icon?: string; active: boolean; onClick: () => void; children?: ReactNode }> = (props) => {
  return (
    <a className={cx(!!props.active && 'bg-[#00000014] dark:bg-[#ffffff26] rounded-[6px]')} onClick={props.onClick}>
      {props.icon ? <img src={props.icon} className="w-8 h-8 cursor-pointer" /> : props.children}
    </a>
  )
}

const ImageInputLayoutIcon: FC = () => {
  return (
    <svg
      className="w-8 h-8 cursor-pointer text-[#BDBDBD]"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 6.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H9l-2 1.5V10.5H7a2 2 0 0 1-2-2v-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <path
        d="M12 6.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1l-2 1.5V10.5h-0a2 2 0 0 1-2-2v-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M4 18h16" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="10" cy="18" r="2" fill="currentColor" />
    </svg>
  )
}

interface Props {
  layout: Layout
  onChange: (layout: Layout) => void
}

const LayoutSwitch: FC<Props> = (props) => {
  return (
    <div className="flex flex-row items-center gap-2 bg-primary-background rounded-2xl px-4">
      <Item
        icon={layoutTwoIcon}
        active={props.layout === 2 || props.layout === 'twoVertical'}
        onClick={() => props.onChange(2)}
      />
      <Item icon={layoutThreeIcon} active={props.layout === 3} onClick={() => props.onChange(3)} />
      <Item icon={layoutFourIcon} active={props.layout === 4} onClick={() => props.onChange(4)} />
      <Item icon={layoutSixIcon} active={props.layout === 'sixGrid'} onClick={() => props.onChange('sixGrid')} />
      <Item active={props.layout === 'imageInput'} onClick={() => props.onChange('imageInput')}>
        <ImageInputLayoutIcon />
      </Item>
    </div>
  )
}

export default LayoutSwitch
