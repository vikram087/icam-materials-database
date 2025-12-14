import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "../styles/pagination.css";

function Pagination({ handlePageClick, totalPages }) {
	const location = useLocation();

	useEffect(() => {
		const query = new URLSearchParams(location.search);
		let page = Number(query.get("page")) || 1;
		if (page < 0) {
			page = 1;
		}
		setPageNumber(page || 1);
	}, [location.search]);

	const [pageNumber, setPageNumber] = useState(1);

	const handleBack = () => {
		if (pageNumber >= 2) {
			handlePageClick(pageNumber - 1);
			setPageNumber(pageNumber - 1);
		}
	};

	const handleFront = () => {
		if (pageNumber <= totalPages - 1) {
			handlePageClick(Number(pageNumber) + 1);
			setPageNumber(Number(pageNumber) + 1);
		}
	};

	const handleNumber = (page) => {
		if (Number(pageNumber) !== page) {
			handlePageClick(page);
			setPageNumber(page);
		}
	};

	const handleSubmit = (event) => {
		if (event.key === "Enter") {
			let targetPage = Number(pageNumber);

			if (targetPage < 1) {
				targetPage = 1;
			} else if (targetPage > totalPages) {
				targetPage = totalPages;
			}

			handlePageClick(targetPage);
			setPageNumber(targetPage);
		}
	};

	const handleInputChange = (event) => {
		setPageNumber(event.target.value);
	};

	// Generate page numbers to display
	const getPageNumbers = () => {
		const pages = [];
		const currentPage = Number(pageNumber);
		const maxVisible = 5;

		if (totalPages <= maxVisible) {
			// Show all pages if total is small
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			// Always show first page
			pages.push(1);

			// Calculate range around current page
			const start = Math.max(2, currentPage - 1);
			const end = Math.min(totalPages - 1, currentPage + 1);

			// Add ellipsis after first page if needed
			if (start > 2) {
				pages.push("...");
			}

			// Add pages around current
			for (let i = start; i <= end; i++) {
				pages.push(i);
			}

			// Add ellipsis before last page if needed
			if (end < totalPages - 1) {
				pages.push("...");
			}

			// Always show last page
			if (totalPages > 1) {
				pages.push(totalPages);
			}
		}

		return pages;
	};

	if (totalPages <= 1) {
		return null;
	}

	return (
		<div className="flex justify-center items-center">
			<div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
				{/* First Page Button */}
				<button
					type="button"
					onClick={() => handleNumber(1)}
					disabled={pageNumber === 1}
					className="pagination-button"
					aria-label="First page"
				>
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<title>First page</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
						/>
					</svg>
				</button>

				{/* Previous Button */}
				<button
					type="button"
					onClick={handleBack}
					disabled={pageNumber === 1}
					className="pagination-button"
					aria-label="Previous page"
				>
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<title>Back</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</button>

				{/* Page Numbers */}
				<div className="hidden sm:flex items-center gap-1">
					{getPageNumbers().map((page, index) =>
						page === "..." ? (
							<span
								key={`${index}_${page}`}
								className="px-3 py-1.5 text-gray-400"
							>
								...
							</span>
						) : (
							<button
								key={page}
								type="button"
								onClick={() => handleNumber(page)}
								className={`pagination-number ${
									pageNumber === page ? "pagination-number-active" : ""
								}`}
							>
								{page}
							</button>
						),
					)}
				</div>

				{/* Page Input (Mobile) */}
				<div className="flex sm:hidden items-center gap-2 px-3">
					<input
						type="number"
						value={pageNumber}
						onChange={handleInputChange}
						onKeyDown={handleSubmit}
						className="w-16 px-2 py-1.5 text-center text-sm border border-gray-200 rounded focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
						min="1"
						max={totalPages}
					/>
					<span className="text-sm text-gray-500">/ {totalPages}</span>
				</div>

				{/* Next Button */}
				<button
					type="button"
					onClick={handleFront}
					disabled={pageNumber === totalPages}
					className="pagination-button"
					aria-label="Next page"
				>
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<title>Front page</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>

				{/* Last Page Button */}
				<button
					type="button"
					onClick={() => handleNumber(totalPages)}
					disabled={pageNumber === totalPages}
					className="pagination-button"
					aria-label="Last page"
				>
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<title>Specific page</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M13 5l7 7-7 7M5 5l7 7-7 7"
						/>
					</svg>
				</button>

				{/* Page Input (Desktop) */}
				<div className="hidden sm:flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
					<span className="text-sm text-gray-600">Go to:</span>
					<input
						type="number"
						value={pageNumber}
						onChange={handleInputChange}
						onKeyDown={handleSubmit}
						className="w-20 px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
						min="1"
						max={totalPages}
					/>
				</div>
			</div>
		</div>
	);
}

export default Pagination;
