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
			if (pageNumber < 2 && pageNumber > 1) {
				handlePageClick(1);
				setPageNumber(1);
			} else if (pageNumber > totalPages - 1 && pageNumber < totalPages) {
				handlePageClick(totalPages);
				setPageNumber(totalPages);
			} else if (pageNumber <= totalPages - 1 && pageNumber >= 2) {
				handlePageClick(pageNumber);
				setPageNumber(pageNumber);
			}
		}
	};

	const handleInputChange = (event) => {
		setPageNumber(event.target.value);
	};

	return (
		<div className="pagination-wrapper">
			<div className="pagination-container">
				<button
					type="button"
					style={{ cursor: "pointer" }}
					onClick={() => handleNumber(1)}
				>
					&lt;&lt;&nbsp;
				</button>
				<button
					type="button"
					style={{ cursor: "pointer" }}
					onClick={handleBack}
				>
					&nbsp;&lt;&nbsp;
				</button>
				<input
					type="number"
					onKeyDown={handleSubmit}
					value={pageNumber}
					onChange={handleInputChange}
				/>
				<button
					type="button"
					style={{ cursor: "pointer" }}
					onClick={handleFront}
				>
					&nbsp;&gt;&nbsp;
				</button>
				<button
					type="button"
					style={{ cursor: "pointer" }}
					onClick={() => handleNumber(totalPages)}
				>
					&nbsp;&gt;&gt;&nbsp;
				</button>
			</div>
		</div>
	);
}

export default Pagination;
