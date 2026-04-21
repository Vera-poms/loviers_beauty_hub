import { Select, Portal, createListCollection } from '@chakra-ui/react';
import {useMemo} from "react"

interface SelectOption{
    label: string;
    value: string
}

interface AppSelectProps{
    options: SelectOption[]
    label?: string
    placeholder?: string
    width?: string
    paddingY?: string
    value?: string | string[]
    onValueChange: (details: any) => void
}

export const AppSelect = ({
    options,
    label="Select an option",
    placeholder="Select...",
    width="100%",
    paddingY="4",
    onValueChange,
    value
}: AppSelectProps) => {
    const collection = useMemo(() =>
    createListCollection({
        items: options,
    }), [options])
  return (
    <Select.Root
    collection={collection}
    width={width}
    onValueChange={onValueChange}
    paddingY={paddingY}
    value={Array.isArray(value) ? value : value ? [value] : []}
    >
        {label && <Select.Label>{label}</Select.Label>}
        <Select.Control>
            <Select.Trigger>
                <Select.ValueText placeholder={placeholder}/>
            </Select.Trigger>
            <Select.IndicatorGroup>
                <Select.Indicator />
            </Select.IndicatorGroup>
        </Select.Control>

        <Portal>
            <Select.Positioner>
                <Select.Content>
                    {collection.items.map((item) => (
                        <Select.Item item={item} key={item.value}>
                            {item.label}
                        </Select.Item>
                    ))}
                </Select.Content>
            </Select.Positioner>
        </Portal>
    </Select.Root>
  )
}

export default AppSelect