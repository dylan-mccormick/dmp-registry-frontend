import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { isValidElement, useCallback, useEffect, useState, type JSX } from "react";

interface HTMLTableProps<T> {
    columns: { text: string, dataKey: keyof T, queryable?: boolean, fixedPixelSize?: number }[];
    data: T[];
}

const HighlightedText = ({ text, highlight }: { text: string; highlight: string | null }) => {
    if (!highlight) return <>{text}</>;

    const lowerText = text.toLowerCase();
    const lowerHighlight = highlight.toLowerCase();
    const index = lowerText.indexOf(lowerHighlight);

    if (index === -1) return <>{text}</>;

    return (
        <>
            {text.slice(0, index)}
            <mark className="bg-yellow-200">{text.slice(index, index + highlight.length)}</mark>
            {text.slice(index + highlight.length)}
        </>
    );
};

const ColumnHeader = <T,>({ col, index, sortKey, sortDirection, toggleSortBy, searchKey, setSearchTerm }: { col: { text: string, dataKey: keyof T, queryable?: boolean }; index: number; sortKey: keyof T | null; sortDirection: "asc" | "desc" | null; toggleSortBy: (dataKey: keyof T) => () => void; searchKey: keyof T | null; setSearchTerm: (dataKey: keyof T, value: string | null) => void }) => {
    const [ searchOpen, setSearchOpen ] = useState(false);

    useEffect(() => {
        if (!searchOpen && searchKey === col.dataKey) {
            setSearchTerm(col.dataKey, null);
        }
    }, [searchOpen, col.dataKey, setSearchTerm, searchKey]);

    return <>
        <th className="border-y-2 border-x border-gray-300 px-4 py-2 min-w-37.5 sm:min-w-45" key={index}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 w-full">
                <div className={`flex flex-row justify-between items-center sm:flex-1 sm:min-w-0 ${col.queryable !== false ? "sm:max-w-[calc(100%-60px)]" : ""}`}>
                    {searchOpen ? (
                        <input
                            type="text"
                            className="hidden sm:block border border-gray-300 px-2 py-1 rounded font-normal w-full mr-2 min-w-0"
                            placeholder="Search..."
                            onChange={(e) => setSearchTerm(col.dataKey, e.target.value.length > 0 ? e.target.value : null)}
                        />
                    ) : (
                        <span className="truncate">{col.text}</span>
                    )}
                </div>

                {col.queryable !== false && (
                    <div className="flex flex-row items-center shrink-0">
                        <button className="text-gray-500 hover:text-gray-700" onClick={() => setSearchOpen(!searchOpen)}>
                            <Search className="w-4 h-4" />
                        </button>
                        <button className="ml-1 text-gray-500 hover:text-gray-700" onClick={toggleSortBy(col.dataKey)}>
                            {sortKey === col.dataKey ? (
                                sortDirection === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                            ) : (
                                <ArrowUpDown className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                )}

                {searchOpen && (
                    <input
                        type="text"
                        className="sm:hidden border border-gray-300 px-2 py-1 rounded font-normal w-full"
                        placeholder="Search..."
                    />
                )}
            </div>
        </th>
    </>;
}

const HTMLTable = <T,>({ data, columns }: HTMLTableProps<T>) => {
    const [ sortedData, setSortedData ] = useState(data);
    const [ sortKey, setSortKey ] = useState<keyof T | null>(null);
    const [ sortDirection, setSortDirection ] = useState<"asc" | "desc" | null>(null);
    const [ filterKey, setFilterKey ] = useState<keyof T | null>(null);
    const [ filterValue, setFilterValue ] = useState<string | null>(null);

    const [ currentPage, setCurrentPage ] = useState(1);
    const [ itemsPerPage, setItemsPerPage ] = useState(10);
    const [ unpagedResultCount, setUnpagedResultCount ] = useState(data.length);
    const [ pageInput, setPageInput ] = useState(String(currentPage));

    const toggleSortBy = (dataKey: keyof T) => () => {
        if (sortKey === dataKey) {
            const nextDirection = sortDirection === "asc" ? "desc" : (sortDirection === "desc" ? null : "asc");
            setSortDirection(nextDirection);
            if (nextDirection === null) setSortKey(null);
        } else {
            setSortKey(dataKey);
            setSortDirection("asc");
        }
        setCurrentPage(1);
    }

    const setSearchTerm = useCallback((dataKey: keyof T, value: string | null) => {
        setFilterKey(dataKey);
        setFilterValue(value ? value.trim() : null);
        setCurrentPage(1);
    }, []);

    const trySetCurrentPage = (page: number) => {
        if (page < 1 || page > Math.ceil(unpagedResultCount / itemsPerPage)) return;
        setCurrentPage(page);
    };

    const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPageInput(e.target.value); // always update the visual input freely
    };

    const commitPageInput = () => {
        const page = Number(pageInput);
        if (!isNaN(page)) trySetCurrentPage(page);
        else setPageInput(String(currentPage)); // revert if invalid
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPageInput(String(currentPage));
    }, [currentPage]);

    useEffect(() => {
        let filtered = [...data];

        if (filterValue && filterKey) {
            const lowerFilter = filterValue.toLowerCase();
            filtered = filtered.filter(row =>
                String(row[filterKey]).toLowerCase().includes(lowerFilter)
            );

            filtered.sort((a, b) => {
                const aIndex = String(a[filterKey]).toLowerCase().indexOf(lowerFilter);
                const bIndex = String(b[filterKey]).toLowerCase().indexOf(lowerFilter);
                return aIndex - bIndex;
            });
        }

        let sorted: T[];
        if (sortKey) {
            sorted = [...filtered].sort((a, b) => {
                const aValue = a[sortKey];
                const bValue = b[sortKey];
                if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
                if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
                return 0;
            });
        } else {
            sorted = filtered;
        }

        const shortenedSorted = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSortedData(shortenedSorted);
        setUnpagedResultCount(sorted.length);
    }, [data, filterKey, filterValue, sortKey, sortDirection, currentPage, itemsPerPage]);

    return <div className="overflow-auto" >

        <table className="w-full border-collapse table-fixed">
            <colgroup>
                {columns.map((col, index) => (
                    <col key={index} style={col.fixedPixelSize ? { width: `${col.fixedPixelSize}px` } : undefined} />
                ))}
            </colgroup>
            <thead className="sticky top-0 z-10">
                <tr>
                    {columns.map((col, index) => (
                        <ColumnHeader
                            key={index}
                            col={col}
                            index={index}
                            sortKey={sortKey}
                            sortDirection={sortDirection}
                            toggleSortBy={toggleSortBy}
                            searchKey={filterKey}
                            setSearchTerm={setSearchTerm}
                        />
                    ))}
                </tr>
            </thead>
            <tbody>
                {sortedData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-100" >
                        {columns.map((col, colIndex) => {
                            if (isValidElement(row[col.dataKey])) {
                                const element = row[col.dataKey] as unknown as JSX.Element;
                                return <td key={colIndex} title={element.props?.title || String(col.dataKey)} className="border border-gray-300 px-4 py-2 text-sm font-normal truncate" >
                                    {element}
                                </td>
                            }

                            return <td key={colIndex} title={String(row[col.dataKey])} className="border border-gray-300 px-4 py-2 text-sm font-normal truncate" >
                                {col.dataKey === filterKey ? (
                                    <HighlightedText text={String(row[col.dataKey])} highlight={filterValue} />
                                ) : (
                                    String(row[col.dataKey])
                                )}
                            </td>
                        })}
                    </tr>
                ))}
                <th className="border-y-2 border-x border-gray-300 px-4 py-2 text-left text-sm font-normal" colSpan={columns.length} >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2" >
                        <div>
                            <span>Showing {currentPage * itemsPerPage - itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, unpagedResultCount)} of {unpagedResultCount} results</span>
                            <div className="flex flex-row items-center gap-2" >
                                <span>Results per page:</span>
                                <select className="mx-2 border border-gray-300 rounded" value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex flex-row items-center gap-2" >
                            <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="text-gray-500 enabled:hover:text-gray-700 disabled:text-gray-200"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <input
                                type="number"
                                className="mx-2 w-12 border border-gray-300 rounded text-center"
                                value={pageInput}
                                onChange={handlePageInputChange}
                                onBlur={commitPageInput}
                                onKeyDown={(e) => { if (e.key === 'Enter') commitPageInput(); }}
                            />
                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage * itemsPerPage >= unpagedResultCount}
                                className="text-gray-500 enabled:hover:text-gray-700 disabled:text-gray-200"
                            >
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </th>
            </tbody>
        </table>
    </div>
}

export default HTMLTable;