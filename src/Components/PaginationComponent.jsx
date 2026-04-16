import { Pagination } from "react-bootstrap";

function buildVisiblePages(totalPages, currentPage, maxVisiblePages) {
  if (totalPages <= maxVisiblePages) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const half = Math.floor(maxVisiblePages / 2);
  let start = Math.max(1, currentPage - half);
  let end = start + maxVisiblePages - 1;

  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - maxVisiblePages + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export default function PaginationComponent({
  currentPage = 1,
  totalItems = 0,
  itemsPerPage = 12,
  onPageChange,
  maxVisiblePages = 5,
}) {
  const safeItemsPerPage = Number.isFinite(itemsPerPage) && itemsPerPage > 0 ? itemsPerPage : 12;
  const totalPages = Math.ceil(Number(totalItems || 0) / safeItemsPerPage);

  if (totalPages <= 1) return null;

  const safeCurrentPage = Math.min(Math.max(Number(currentPage) || 1, 1), totalPages);
  const visiblePages = buildVisiblePages(totalPages, safeCurrentPage, maxVisiblePages);

  const handlePageChange = (page) => {
    if (!onPageChange) return;
    if (page < 1 || page > totalPages || page === safeCurrentPage) return;
    onPageChange(page);
  };

  const showLeftEllipsis = visiblePages[0] > 2;
  const showRightEllipsis = visiblePages[visiblePages.length - 1] < totalPages - 1;

  return (
    <div className="d-flex justify-content-center mt-4 inv-pagination">
      <Pagination className="mb-0">
        <Pagination.Prev
          disabled={safeCurrentPage === 1}
          onClick={() => handlePageChange(safeCurrentPage - 1)}
        >
          Anterior
        </Pagination.Prev>

        {visiblePages[0] > 1 ? (
          <Pagination.Item onClick={() => handlePageChange(1)}>1</Pagination.Item>
        ) : null}

        {showLeftEllipsis ? <Pagination.Ellipsis disabled /> : null}

        {visiblePages.map((page) => (
          <Pagination.Item
            key={page}
            active={safeCurrentPage === page}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </Pagination.Item>
        ))}

        {showRightEllipsis ? <Pagination.Ellipsis disabled /> : null}

        {visiblePages[visiblePages.length - 1] < totalPages ? (
          <Pagination.Item onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </Pagination.Item>
        ) : null}

        <Pagination.Next
          disabled={safeCurrentPage === totalPages}
          onClick={() => handlePageChange(safeCurrentPage + 1)}
        >
          Siguiente
        </Pagination.Next>
      </Pagination>
    </div>
  );
}
