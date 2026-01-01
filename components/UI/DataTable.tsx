import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Loader2, // Added Loader2
} from "lucide-react";

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  sortable?: boolean;
  sortKey?: keyof T;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  title?: string;
  searchPlaceholder?: string;
  primaryAction?: React.ReactNode;
  selectable?: boolean;
  selectedRowIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  loading?: boolean; // Added loading prop
}

export function DataTable<T extends { id: string | number }>({ 
  data,
  columns,
  onRowClick,
  title,
  searchPlaceholder = "Search...",
  primaryAction,
  selectable = false,
  selectedRowIds,
  onSelectionChange,
  loading = false, // Added loading to destructuring with default false
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ 
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Internal selection state if not controlled
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(
    new Set()
  );

  const isControlled = selectedRowIds !== undefined;
  const currentSelectedIds = useMemo(
    () => (isControlled ? new Set(selectedRowIds) : internalSelectedIds),
    [isControlled, selectedRowIds, internalSelectedIds]
  );

  const handleSelection = (newSet: Set<string>) => {
    if (!isControlled) {
      setInternalSelectedIds(newSet);
    }
    if (onSelectionChange) {
      onSelectionChange(Array.from(newSet));
    }
  };

  // --- FILTERING ---
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const lowerQuery = searchQuery.toLowerCase();
    return data.filter((item) => {
      return Object.values(item as any).some((val) => 
        String(val).toLowerCase().includes(lowerQuery)
      );
    });
  }, [data, searchQuery]);

  // --- SORTING ---
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a: any, b: any) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // --- PAGINATION ---
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleExport = () => {
    if (data.length === 0) return;

    const headers = columns.map((c) => c.header).join(",");
    const rows = sortedData.map((row) => {
      return columns
        .map((col) => {
          const val =
            typeof col.accessor === "function"
              ? "Complex Data"
              : (row as any)[col.accessor];
          return `"${String(val).replace(/"/g, '""')}"`
        })
        .join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title || "data"}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Selection Logic
  const isAllSelected =
    filteredData.length > 0 &&
    filteredData.every((item) => currentSelectedIds.has(String(item.id)));
  const isIndeterminate = currentSelectedIds.size > 0 && !isAllSelected;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSet = new Set<string>(currentSelectedIds);
    if (e.target.checked) {
      filteredData.forEach((item) => newSet.add(String(item.id)));
    } else {
      filteredData.forEach((item) => newSet.delete(String(item.id)));
    }
    handleSelection(newSet);
  };

  const handleSelectRow =
    (e: React.MouseEvent | React.ChangeEvent, id: string) => {
    e.stopPropagation();
    const newSet = new Set<string>(currentSelectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    handleSelection(newSet);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden relative"> 
      {loading && ( // Loading overlay
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <Loader2 size={48} className="animate-spin text-primary-600" />
        </div>
      )}
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50">
        <div className="flex-1 w-full md:w-auto">
          {title && (
            <h3 className="font-bold text-slate-800 mb-2 md:mb-0">{title}</h3>
          )}
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white text-slate-900"
            />
            <Search
              className="absolute left-3 top-2.5 text-slate-400"
              size={16}
            />
          </div>

          <button
            onClick={handleExport}
            className="flex items-center justify-center px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium transition"
            title="Export CSV"
          >
            <Download size={16} className="md:mr-2" />
            <span className="hidden md:inline">Export</span>
          </button>

          {primaryAction}
        </div>
      </div>
      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-white border-b border-slate-200 text-slate-500 text-xs uppercase font-bold">
            <tr>
              {selectable && (
                <th className="px-6 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isIndeterminate;
                    }}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
              )}
              {columns.map((col, idx) => {
                const sortKey =
                  (typeof col.accessor === "string" ? col.accessor : col.sortKey) as string;
                const isSorted = sortConfig?.key === sortKey;

                return (
                  <th
                    key={idx}
                    className={`px-6 py-4 whitespace-nowrap ${col.className || ""} ${ 
                      col.sortable
                        ? "cursor-pointer hover:bg-slate-50 select-none"
                        : ""
                    }`}
                    onClick={() => 
                      col.sortable && sortKey && handleSort(sortKey)
                    }
                  >
                    <div
                      className={`flex items-center ${ 
                        col.className?.includes("text-right")
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      {col.header}
                      {col.sortable && (
                        <span className="ml-2 text-slate-400">
                          {isSorted ? (
                            sortConfig?.direction === "asc" ? (
                              <ArrowUp size={12} />
                            ) : (
                              <ArrowDown size={12} />
                            )
                          ) : (
                            <ArrowUpDown size={12} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, rowIdx) => (
                <tr
                  key={item.id}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`hover:bg-slate-50 transition ${ 
                    onRowClick ? "cursor-pointer" : ""
                  } ${ 
                    currentSelectedIds.has(String(item.id)) ? "bg-blue-50" : ""
                  }`}
                >
                  {selectable && (
                    <td className="px-6 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={currentSelectedIds.has(String(item.id))}
                        onChange={(e) => handleSelectRow(e, String(item.id))}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                  )}
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`px-6 py-4 text-sm text-slate-700 ${col.className || ""}`}
                    >
                      {typeof col.accessor === "function"
                        ? col.accessor(item)
                        : (item as any)[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center justify-center">
                    <Filter size={32} className="mb-2 opacity-20" />
                    <p>No records found matching your search.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination Footer */}
      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-center text-sm text-slate-600 gap-4">
        <div>
          Showing{" "}
          <span className="font-medium">
            {Math.min((currentPage - 1) * rowsPerPage + 1, filteredData.length)}
          </span>{" "}to{" "}
          <span className="font-medium">
            {Math.min(currentPage * rowsPerPage, filteredData.length)}
          </span>{" "}of <span className="font-medium">{filteredData.length}</span> results
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-300 rounded bg-white text-slate-700 text-sm p-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}