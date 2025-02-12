import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { TailSpin } from "react-loader-spinner";
import Search from "../components/search.jsx";
import Content from "../components/mathjax.jsx";
import Pagination from "../components/pagination.jsx";
import "../styles/papers.css";
import NavBar from "../components/navbar.jsx";

function Papers({ searchParams, setSearchParams, setPrevUrl, setPaperToUse }) {
	const location = useLocation();

	const [papers, setPapers] = useState([]);
	const [pageCount, setPageCount] = useState(0);
	const [expandedIndex, setExpandedIndex] = useState(-1);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [time, setTime] = useState("");
	const [highlightedStars, setHighlightedStars] = useState([]);
	const [inflated, setInflated] = useState(-1);
	const [searchQuery, setSearchQuery] = useState("");

	const navigate = useNavigate();

	const toggleExpand = (index) => {
		if (expandedIndex === index) {
			setExpandedIndex(-1);
		} else {
			setExpandedIndex(index);
		}
	};

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

				setExpandedIndex(-1);
				setPapers(data.papers);
				setTotal(data.total);
				setPageCount(Math.ceil(data.total / searchParams.per_page));
				setInflated(data.inflated);
			})
			.catch((error) => {
				setExpandedIndex(-1);
				setTotal(0);
				setPapers([]);
				setPageCount(0);
				setInflated(-1);
			});
	};

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

		console.log(searches);
		setSearchQuery(parseSearchQuery(searches));

		const startTime = performance.now();

		setLoading(true);

		getPapers(page, perPage, sorting, startTime, date, searches);
	}, [
		location.search,
		/*searchParams.page,
		searchParams.per_page,
		searchParams.query,
		searchParams.sorting,
		searchParams.term,
		searchParams.date,
		searchParams,
		setSearchParams,
		getPapers,*/
	]);

	const changePage = (page) => {
		setSearchParams((prevParams) => ({
			...prevParams,
			page: page,
		}));

		const advStr = encodeURIComponent(JSON.stringify(searchParams.searches));

		navigate(
			`?page=${page}&per_page=${searchParams.per_page}` +
				`&sort=${searchParams.sorting}` +
				`&${searchParams.date}&searches=${advStr}`,
		);
	};

	const changePaper = (paper) => {
		const id = paper.id.replace("/-/g", "/");

		const advStr = encodeURIComponent(JSON.stringify(searchParams.searches));

		const papers =
			`/papers?page=${searchParams.page}&per_page=${searchParams.per_page}` +
			`&sort=${searchParams.sorting}` +
			`&${searchParams.date}&${advStr}`;

		setPrevUrl(papers);
		setPaperToUse(paper);
		navigate(`/paper/${id}`);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const handlePageClick = (pageNumber) => {
		setPapers([]);
		changePage(pageNumber);
	};

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

	const numToDate = (date) => {
		const monthsReversed = {
			"01": "January,",
			"02": "February,",
			"03": "March,",
			"04": "April,",
			"05": "May,",
			"06": "June,",
			"07": "July,",
			"08": "August,",
			"09": "September,",
			10: "October,",
			11: "November,",
			12: "December,",
		};

		const year = date.substring(0, 4);
		const month = monthsReversed[date.substring(4, 6)];
		const day = date.substring(6);

		return `${day} ${month} ${year}`;
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

	const chooseBody = () => {
		if (!loading && total === 0) {
			return (
				<div className="content-area">
					<div>
						<p className="pag-container results">
							Please adjust search parameters to yield results
						</p>
					</div>
				</div>
			);
		}
		if (!loading) {
			return (
				<div className="content-area">
					<div>
						<div style={{ textAlign: "center" }}>
							<p>
								{!loading &&
									`${total} Results in ${time} seconds (${pageCount} pages)`}
							</p>
							<p>
								{total >= 10000
									? "Results are Limited to the first 10,000 matching documents"
									: ""}
							</p>
							<b>Displaying Results for: "{searchQuery}"</b>
							{inflated !== -1 && (
								<p>
									Not many relevant papers, expanding from {inflated} to 100
									results
								</p>
							)}
						</div>
					</div>
					<ul style={{ paddingRight: "40px" }}>
						{papers?.map((paper, index) => (
							<div
								className={
									index === expandedIndex ? "expanded-container" : "container"
								}
								key={`${paper.id}_papers_body`}
							>
								<div className="title-container">
									<button
										type="button"
										style={{
											cursor: "pointer",
											border: "none",
											background: "none",
											padding: 0,
											textAlign: "left",
										}}
										onClick={() => changePaper(paper)}
									>
										<u className="paper-title">
											<Content content={paper.title} />
										</u>
									</button>
									<button
										style={{
											cursor: "pointer",
											border: "none",
											background: "none",
											padding: 0,
										}}
										type="button"
										onClick={() => toggleStar(paper)}
									>
										<img
											width={20}
											height={20}
											src={
												highlightedStars.some((p) => p.id === paper.id)
													? "/filled_star.png"
													: "/empty_star.png"
											}
											className="star-icon"
											alt="star icon"
										/>
									</button>
								</div>
								<p>
									by&nbsp;
									{paper.authors.map((author, index) => (
										<span key={`${paper.id}_authors_papers_${index}`}>
											<em>
												<Content content={author} mode="highlightOnly" />
												{index < paper.authors.length - 1 ? ", " : ""}
											</em>
										</span>
									))}{" "}
									&mdash; {numToDate(String(paper.date))}
								</p>
								<div
									className={expandedIndex === index ? "text expanded" : "text"}
								>
									<Content content={paper.summary} />
									<button
										type="button"
										style={{
											cursor: "pointer",
											border: "none",
											background: "none",
											padding: 0,
										}}
										className="expand-button"
										onClick={() => toggleExpand(index)}
									>
										{expandedIndex === index ? "⌃" : "⌄"}
									</button>
								</div>

								{paper.MAT !== "N/A" && (
									<p>
										<strong>Materials:</strong>{" "}
										{paper.MAT.map((item, index) => (
											<span key={`${index}_${item}`}>
												{item}
												{index < paper.MAT.length - 1 ? ", " : ""}
											</span>
										))}
									</p>
								)}
							</div>
						))}
					</ul>
				</div>
			);
		}
		if (loading) {
			return (
				<div className="papers-loader">
					<p>Loading ...</p>
					<TailSpin color="#00BFFF" height={100} width={100} />
				</div>
			);
		}
	};

	return (
		<div>
			<NavBar searchParams={searchParams} />
			<div className="page-main">
				<h1 style={{ marginTop: "10px" }}>Papers</h1>
				<Search searchParams={searchParams} to="/papers" />

				<div className="page-wrapper">
					<Pagination
						handlePageClick={handlePageClick}
						totalPages={pageCount}
					/>
					{chooseBody()}
					<ScrollToTop />
					<ScrollToBottom />
				</div>
			</div>
		</div>
	);
}

export function ScrollToTop() {
	const scrollToTopButton = () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	return (
		<button
			className="bu scroll-to-top-container"
			onClick={scrollToTopButton}
			type="button"
		>
			<svg
				className="svgIcon"
				viewBox="0 0 384 512"
				role="img"
				aria-label="scroll to top"
			>
				<path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z" />
			</svg>
		</button>
	);
}

export function ScrollToBottom() {
	const scrollToBottomButton = () => {
		window.scrollTo({
			top: document.documentElement.scrollHeight,
			behavior: "smooth",
		});
	};

	return (
		<button
			type="button"
			className="bu scroll-to-bottom-container"
			onClick={scrollToBottomButton}
		>
			<svg
				className="svgIcon"
				viewBox="0 0 384 512"
				role="img"
				aria-label="scroll to bottom"
			>
				<path d="M214.6 410.6c-12.5 12.5-32.8 12.5-45.3 0l-160-160c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 310.8V16c0-17.7 14.3-32 32-32s32 14.3 32 32v294.8l115.4-115.4c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3l-160 160z" />
			</svg>
		</button>
	);
}

export default Papers;
