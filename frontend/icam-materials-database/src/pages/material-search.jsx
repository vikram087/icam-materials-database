import NavBar from "../components/navbar";
import "../styles/material-search.css";
import { ScrollToBottom, ScrollToTop } from "./papers";
import { useEffect, useState } from "react";
import Search from "../components/search";
import Filters from "../components/filters";
import { useLocation, useNavigate } from "react-router-dom";
import Pagination from "../components/pagination";
import { TailSpin } from "react-loader-spinner";

function Table({ tableParams, setTableParams, setPrevUrl }) {
	const [time, setTime] = useState(0);
	const [loading, setLoading] = useState(false);
	const [papers, setPapers] = useState([]);
	const [total, setTotal] = useState(0);
	const [pageCount, setPageCount] = useState(0);
	const [highlightedStars, setHighlightedStars] = useState({});

	const location = useLocation();
	const navigate = useNavigate();

	const toggleStar = (paper) => {
		setHighlightedStars((prev) => {
			const isStarred = prev.some((p) => p.id === paper.id);

			const newStars = isStarred
				? prev.filter((p) => p.id !== paper.id)
				: [...prev, paper];

			localStorage.setItem("highlightedStars", JSON.stringify(newStars));
			return newStars;
		});
	};

	const columns = [
		{ header: "Material", key: "MAT" },
		{ header: "Description", key: "DSC" },
		{ header: "Symmetry", key: "SPL" },
		{ header: "Synthesis", key: "SMT" },
		{ header: "Characterization", key: "CMT" },
		{ header: "Property", key: "PRO" },
		{ header: "Application", key: "APL" },
		{ header: "favorite", key: null },
	];

	useEffect(() => {
		const query = new URLSearchParams(location.search);
		const page = Number(query.get("page")) || tableParams.page;
		const perPage = Number(query.get("per_page")) || tableParams.per_page;
		const search = query.get("query") || tableParams.query;
		const sorting = query.get("sort") || tableParams.sorting;
		const term = query.get("term") || tableParams.term;
		const date = query.get("date") || tableParams.date;

		const storedStars =
			JSON.parse(localStorage.getItem("highlightedStars")) || [];
		setHighlightedStars(Array.isArray(storedStars) ? storedStars : []);

		setTableParams({
			per_page: perPage,
			page: page,
			query: search,
			sorting: sorting,
			term: term,
			date: date,
		});

		const startTime = performance.now();

		setLoading(true);

		getPapers(page, perPage, search, sorting, startTime, term, date);
	}, [location.search]);

	const getPapers = (
		page,
		results,
		query,
		sorting,
		startTime,
		term,
		dateRange,
	) => {
		const backend_url = import.meta.env.VITE_BACKEND_URL;

		fetch(`${backend_url}/api/materials/${term}/${query}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				page: page,
				results: results,
				sorting: sorting,
				date: dateRange,
			}),
		})
			.then((response) => response.json())
			.then((data) => {
				const endTime = performance.now();
				const totalTimeS = (endTime - startTime) / 1000;
				const totalTime = totalTimeS.toFixed(2);

				setTime(totalTime);
				setLoading(false);

				setPapers(data.papers);
				setTotal(data.total);
				setPageCount(Math.ceil(data.total / tableParams.per_page));
			})
			.catch((error) => {
				setTotal(0);
				setPapers([]);
				setPageCount(0);
			});
	};

	const handlePageClick = (pageNumber) => {
		setPapers([]);
		changePage(pageNumber);
	};

	const changePage = (page) => {
		setTableParams((prevParams) => ({
			...prevParams,
			page: page,
		}));

		navigate(
			`?page=${page}&per_page=${tableParams.per_page}` +
				`&query=${tableParams.query}&sort=${tableParams.sorting}` +
				`&term=${tableParams.term}&` +
				`${tableParams.date}`,
		);
	};

	const changePaper = (paperId) => {
		console.log(paperId);
		const papers =
			`/material-search?page=${tableParams.page}&per_page=${tableParams.per_page}` +
			`&query=${tableParams.query}&sort=${tableParams.sorting}` +
			`&term=${tableParams.term}&` +
			`${tableParams.date}`;

		setPrevUrl(papers);
		navigate(`/papers/${paperId}`);
	};

	return (
		<>
			<NavBar />
			<div className="mat-search-container">
				<h1 style={{ marginTop: "-10px" }}>Search Materials</h1>
				<Search searchParams={tableParams} />
				<div className="content-container">
					<div className="filters-section">
						<Filters
							searchParams={tableParams}
							terms={[
								"Material",
								"Description",
								"Symmetry",
								"Synthesis",
								"Characterization",
								"Property",
								"Application",
							]}
						/>
					</div>

					<div className="table-section">
						<div>
							<Pagination
								handlePageClick={handlePageClick}
								totalPages={pageCount}
							/>
							<p>{!loading && `${total} Results in ${time} seconds`}</p>
							<p>
								{total === 10000
									? "Results are Limited to the first 10,000 matching documents"
									: ""}
							</p>
							<b>Displaying Results for: "{tableParams.query}"</b>
						</div>
						{!loading ? (
							<table className="materials-table">
								<thead>
									<tr>
										{columns.map((column) => (
											<th key={column.key}>{column.header}</th>
										))}
									</tr>
								</thead>
								<tbody>
									{papers?.map((row, index) => (
										<tr key={index}>
											{columns.map((column) => (
												<td
													key={column.key || `star-${index}`}
													onClick={
														column.key
															? () => changePaper(row.id.replace("/-/g", "/"))
															: undefined // Only make other cells clickable, not the star cell
													}
												>
													{column.key ? (
														Array.isArray(row[column.key]) ? (
															row[column.key].join(", ")
														) : (
															row[column.key] || "N/A"
														)
													) : (
														// Render favorite star icon in the dedicated cell
														<img
															width={20}
															height={20}
															src={
																highlightedStars.some((p) => p.id === row.id)
																	? "/filled_star.png"
																	: "/empty_star.png"
															}
															onClick={(e) => {
																e.stopPropagation();
																toggleStar(row);
															}}
															className="star-icon"
															alt="star icon"
														/>
													)}
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						) : (
							<div className="papers-loader">
								<p>Loading ...</p>
								<TailSpin color="#00BFFF" height={100} width={100} />
							</div>
						)}
					</div>
				</div>
			</div>
			<ScrollToBottom />
			<ScrollToTop />
		</>
	);
}

export default Table;
