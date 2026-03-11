import { Pagination } from "react-bootstrap";

export default function PaginationComponent({ activePage = 1 }) {
  return (
    <div className="d-flex justify-content-center mt-4 inv-pagination">
      <Pagination className="mb-0">
        <Pagination.Prev>Previous</Pagination.Prev>
        <Pagination.Item active={activePage === 1}>1</Pagination.Item>
        <Pagination.Item active={activePage === 2}>2</Pagination.Item>
        <Pagination.Item active={activePage === 3}>3</Pagination.Item>
        <Pagination.Item active={activePage === 4}>4</Pagination.Item>
        <Pagination.Item active={activePage === 5}>5</Pagination.Item>
        <Pagination.Ellipsis />
        <Pagination.Next>Next</Pagination.Next>
      </Pagination>
    </div>
  );
}
