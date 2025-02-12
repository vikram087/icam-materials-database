import NavBar from "../components/navbar";
import "../styles/properties.css";
import { ScrollToBottom, ScrollToTop } from "./papers";
import { useEffect, useState } from "react";
import Search from "../components/search";
import { useLocation, useNavigate } from "react-router-dom";
import Pagination from "../components/pagination";
import { TailSpin } from "react-loader-spinner";
import Content from "../components/mathjax";

function Table({ searchParams, setSearchParams, setPrevUrl, setPaperToUse }) {
	const [time, setTime] = useState(0);
	const [loading, setLoading] = useState(false);
	const [papers, setPapers] = useState([]);
	const [total, setTotal] = useState(0);
	const [pageCount, setPageCount] = useState(0);
	const [highlightedStars, setHighlightedStars] = useState({});
	const [expandedIndex, setExpandedIndex] = useState(-1);
	const [searchQuery, setSearchQuery] = useState("");

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
		{ header: "Symmetry or Phase Labels", key: "SPL" },
		{ header: "Synthesis", key: "SMT" },
		{ header: "Characterization", key: "CMT" },
		{ header: "Property", key: "PRO" },
		{ header: "Application", key: "APL" },
		{ header: "favorite", key: null },
	];

	useEffect(() => {
		const query = new URLSearchParams(location.search);
		const page = Number(query.get("page")) || searchParams.page;
		const perPage = Number(query.get("per_page")) || searchParams.per_page;
		const sorting = query.get("sort") || searchParams.sorting;
		const date = query.get("date") || searchParams.date;
		const searches =
			JSON.parse(decodeURIComponent(query.get("searches"))) ||
			searchParams.searches;

		const storedStars =
			JSON.parse(localStorage.getItem("highlightedStars")) || [];
		setHighlightedStars(Array.isArray(storedStars) ? storedStars : []);

		setSearchParams({
			per_page: perPage,
			page: page,
			sorting: sorting,
			date: date,
			searches: searches,
		});

		setSearchQuery(parseSearchQuery(searches));

		const startTime = performance.now();

		setLoading(true);

		getPapers(page, perPage, sorting, startTime, date, searches);
	}, [location.search]);

	const getPapers = (
		page,
		results,
		sorting,
		startTime,
		dateRange,
		searches,
	) => {
		const backend_url = import.meta.env.VITE_BACKEND_URL;

		fetch(`${backend_url}/api/papers`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${import.meta.env.VITE_API_KEY}`,
			},
			body: JSON.stringify({
				page: page,
				results: results,
				sorting: sorting,
				date: dateRange,
				searches: searches,
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
				setPageCount(Math.ceil(data.total / searchParams.per_page));
			})
			.catch((error) => {
				setTotal(0);
				setPapers([]);
				setPageCount(0);
			});
	};

	function parseSearchQuery(conditions) {
		return conditions
			.map(({ term, field, operator, isVector }) => {
				let prefix = "";
				if (isVector) {
					prefix = "VECTOR";
				} else if (operator === "") {
					prefix = "AND ";
				} else {
					prefix = operator;
				}

				return `(${prefix} ${field.toLowerCase()}: ${term})`;
			})
			.join(" ");
	}

	const handlePageClick = (pageNumber) => {
		setPapers([]);
		changePage(pageNumber);
	};

	const changePage = (page) => {
		setSearchParams((prevParams) => ({
			...prevParams,
			page: page,
		}));

		const advStr = encodeURIComponent(JSON.stringify(searchParams.searches));

		navigate(
			`?page=${page}&per_page=${searchParams.per_page}` +
				`&sort=${searchParams.sorting}` +
				`&${searchParams.date}` +
				`&${advStr}`,
		);
	};

	const changePaper = (paper) => {
		const id = paper.id.replace("/-/g", "/");

		const advStr = encodeURIComponent(JSON.stringify(searchParams.searches));

		const papers =
			`/properties?page=${searchParams.page}&per_page=${searchParams.per_page}` +
			`&sort=${searchParams.sorting}` +
			`&${searchParams.date}` +
			`&${advStr}`;

		setPaperToUse(paper);
		setPrevUrl(papers);
		navigate(`/paper/${id}`);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const toggleExpand = (index) => {
		if (expandedIndex === index) {
			setExpandedIndex(-1);
		} else {
			setExpandedIndex(index);
		}
	};

	return (
		<>
			<NavBar />
			<h1 style={{ marginTop: "10px" }}>Properties</h1>
			<Search searchParams={searchParams} to="/properties" />
			<div className="content-container">
				<div className="table-section">
					<div>
						<Pagination
							handlePageClick={handlePageClick}
							totalPages={pageCount}
						/>
						<div style={{ textAlign: "center" }}>
							<p>
								{!loading &&
									`${total} Results in ${time} seconds (${pageCount} pages)`}
							</p>
							<p>
								{total === 10000
									? "Results are Limited to the first 10,000 matching documents"
									: ""}
							</p>
							<b>Displaying Results for: "{searchQuery}"</b>
						</div>
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
									<tr key={`${index}_${row}`}>
										{columns.map((column) => (
											<td
												className={
													index === expandedIndex
														? "expanded-col"
														: "minimized-col"
												}
												key={column.key || `star-${index}`}
												onClick={
													column.key ? () => changePaper(row) : undefined
												}
												onKeyDown={
													column.key
														? (e) => {
																if (e.key === "Enter" || e.key === " ") {
																	changePaper(row);
																}
															}
														: undefined
												}
											>
												{column.key ? (
													Array.isArray(row[column.key]) ? (
														row[column.key].length > 0 ? (
															row[column.key].map((item, index) => (
																<Content
																	key={`${index}_${item}`}
																	content={item}
																	mode="highlightOnly"
																/>
															))
														) : (
															"N/A"
														)
													) : (
														(
															<Content
																content={row[column.key]}
																mode="highlightOnly"
															/>
														) || "N/A"
													)
												) : (
													// Render favorite star icon in the dedicated cell
													<button
														type="button"
														style={{
															cursor: "pointer",
															border: "none",
															background: "none",
															padding: 0,
														}}
														onClick={(e) => {
															e.stopPropagation();
															toggleStar(row);
														}}
													>
														<img
															width={20}
															height={20}
															src={
																highlightedStars.some((p) => p.id === row.id)
																	? "/filled_star.png"
																	: "/empty_star.png"
															}
															className="star-icon"
															alt="star icon"
														/>
													</button>
												)}
												{column.header === "favorite" &&
													row[column.key] !== "N/A" && (
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																toggleExpand(index);
															}}
															style={{
																cursor: "pointer",
																border: "none",
																background: "none",
																color: "#f09f9c",
																marginLeft: 15,
															}}
														>
															{expandedIndex === index ? "⌃" : "⌄"}
														</button>
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
			<ScrollToBottom />
			<ScrollToTop />
		</>
	);
}

export default Table;
