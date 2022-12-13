
interface InputProps {
  onChange: (value: string) => void;
  placeHolder?: string;
  value?: string|null;
}

export default function Input({onChange, value = null, placeHolder = ""}: InputProps) {
  return <input {...value !== null ? {value} : null} onChange={e => onChange(e?.target?.value)} placeholder={placeHolder} />
}