import React from 'react';

interface PaginationProps {
    page:         number;
    totalPages:   number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
    page, totalPages, onPageChange
}) => {
    // ← Protection contre NaN/undefined
    const safePage       = isNaN(page)       ? 0 : page;
    const safeTotalPages = isNaN(totalPages) ? 0 : totalPages;

    if (safeTotalPages <= 1) return null;

    const getPageNumbers = () => {
        const delta = 2;
        const range: number[] = [];
        const left  = Math.max(0, safePage - delta);
        const right = Math.min(safeTotalPages - 1, safePage + delta);

        for (let i = left; i <= right; i++) {
            range.push(i);
        }

        if (left > 0) {
            if (left > 1) range.unshift(-1);
            range.unshift(0);
        }

        if (right < safeTotalPages - 1) {
            if (right < safeTotalPages - 2) range.push(-2);
            range.push(safeTotalPages - 1);
        }

        return range;
    };

    return (
        <div className="card-footer bg-white border-0
                        d-flex justify-content-between
                        align-items-center py-3 px-4">

            <small className="text-muted">
                Page <strong>{safePage + 1}</strong> sur{' '}
                <strong>{safeTotalPages}</strong>
            </small>

            <nav>
                <ul className="pagination pagination-sm mb-0 gap-1">

                    <li className={`page-item ${safePage === 0 ? 'disabled' : ''}`}>
                        <button
                            className="page-link rounded-3 border-0"
                            onClick={() => onPageChange(0)}
                            title="Première page"
                        >
                            <i className="bi bi-chevron-double-left" />
                        </button>
                    </li>

                    <li className={`page-item ${safePage === 0 ? 'disabled' : ''}`}>
                        <button
                            className="page-link rounded-3 border-0"
                            onClick={() => onPageChange(safePage - 1)}
                            title="Page précédente"
                        >
                            <i className="bi bi-chevron-left" />
                        </button>
                    </li>

                    {getPageNumbers().map((p, i) =>
                        p < 0 ? (
                            <li key={`ellipsis-${i}`} className="page-item disabled">
                                <span className="page-link border-0 bg-transparent">
                                    ...
                                </span>
                            </li>
                        ) : (
                            <li key={p} className={`page-item ${safePage === p ? 'active' : ''}`}>
                                <button
                                    className="page-link rounded-3 border-0"
                                    onClick={() => onPageChange(p)}
                                >
                                    {String(p + 1)}
                                </button>
                            </li>
                        )
                    )}

                    <li className={`page-item ${safePage === safeTotalPages - 1 ? 'disabled' : ''}`}>
                        <button
                            className="page-link rounded-3 border-0"
                            onClick={() => onPageChange(safePage + 1)}
                            title="Page suivante"
                        >
                            <i className="bi bi-chevron-right" />
                        </button>
                    </li>

                    <li className={`page-item ${safePage === safeTotalPages - 1 ? 'disabled' : ''}`}>
                        <button
                            className="page-link rounded-3 border-0"
                            onClick={() => onPageChange(safeTotalPages - 1)}
                            title="Dernière page"
                        >
                            <i className="bi bi-chevron-double-right" />
                        </button>
                    </li>

                </ul>
            </nav>
        </div>
    );
};

export default Pagination;