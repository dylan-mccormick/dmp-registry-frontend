interface ResourceListProps {
    label: string;
    items: { name: string; count: number }[];
    countNoun: [ string, string ];
    selected?: string;
    onSelect: (name: string) => void;
}

// Sidebar list of tables/collections; the selected item is marked with aria-current
const ResourceList = ({ label, items, countNoun, selected, onSelect }: ResourceListProps) => <nav aria-label={label}>
    <ul className="flex flex-col gap-1 overflow-hidden rounded-2xl bg-surface p-1.5">
        {items.map(item => <li key={item.name}>
            <button
                aria-current={item.name === selected ? "true" : undefined}
                onClick={() => onSelect(item.name)}
                className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-meta transition-colors ${item.name === selected ? "bg-bg font-medium text-ink shadow-[0_1px_2px_rgb(0_0_0/0.06)]" : "text-ink/80 hover:bg-rule/40 hover:text-ink"}`}
            >
                <span className="truncate font-mono">{item.name}</span>
                <span className="shrink-0 text-xs text-legend">{item.count} {item.count === 1 ? countNoun[0] : countNoun[1]}</span>
            </button>
        </li>)}
    </ul>
</nav>;

export default ResourceList;
