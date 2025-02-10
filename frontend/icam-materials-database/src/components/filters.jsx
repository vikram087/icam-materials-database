import { useState, useEffect } from "react";
import "../styles/filters.css";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import AdvancedSearch from "./AdvancedSearch";
import NavBar from "./navbar";

function Filters({ searchParams }) {
	const navigate = useNavigate();

	const [nextPage, setNextPage] = useState("papers");
	const [terms, setTerms] = useState([
		"Abstract",
		"Title",
		"Authors",
		"Category",
	]);
	const [searchTerms, setSearchTerms] = useState(
		searchParams.searches || [
			{ id: 1, term: "", field: "Abstract", operator: "AND", isVector: false },
		],
	);

	useEffect(() => {
		if (nextPage === "properties") {
			setTerms([
				"Material",
				"Description",
				"Symmetry",
				"Synthesis",
				"Characterization",
				"Property",
				"Application",
			]);
		} else {
			setTerms(["Abstract", "Title", "Authors", "Category"]);
		}
	}, [nextPage]);

	const [toggleReset, setToggleReset] = useState(false);

	const [sortVal, setSortVal] = useState(
		searchParams.sorting || "Most-Relevant",
	);
	const [numResults, setNumResults] = useState(searchParams.per_page || 20);

	const results = [10, 20, 50, 100];
	const order = ["Most-Relevant", "Most-Recent", "Oldest-First"];

	const convertIntToDate = (dateNum) => {
		const dateString = String(dateNum);
		const year = dateString.substring(0, 4);
		const month = Number.parseInt(dateString.substring(4, 6), 10) - 1; // 0-based
		const day = Number.parseInt(dateString.substring(6, 8), 10);

		// If invalid or zero, fallback to new Date(0)
		if (
			Number.isNaN(year) ||
			Number.isNaN(month) ||
			Number.isNaN(day) ||
			year + month + day === 0
		) {
			return new Date(0);
		}
		return new Date(year, month, day);
	};

	// Date Range from searchParams
	// If "date" not found, fallback to "19700101-20250101" or similar
	const [startDate, setStartDate] = useState(
		convertIntToDate(searchParams.date.split("-")[0] || "19700101"),
	);
	const [endDate, setEndDate] = useState(
		convertIntToDate(searchParams.date.split("-")[1] || "20991231"),
	);
	const formattedStart = startDate
		.toISOString()
		.split("T")[0]
		.replaceAll("-", "");
	const formattedEnd = endDate.toISOString().split("T")[0].replaceAll("-", "");
	const [dateRange, setDateRange] = useState(
		`${formattedStart}-${formattedEnd}`,
	);

	const handleReset = () => {
		setSortVal("Most-Relevant");
		setNumResults(20);
		setStartDate(new Date(0));
		setEndDate(new Date());
		setNextPage("papers");

		// This toggles so the advanced search resets via useEffect
		setToggleReset((prev) => !prev);
	};

	const updateDateVal = (date, type) => {
		const formattedDate = date.toISOString().split("T")[0].replaceAll("-", "");
		const oldStart = startDate.toISOString().split("T")[0].replaceAll("-", "");
		const oldEnd = endDate.toISOString().split("T")[0].replaceAll("-", "");

		if (type === "start") {
			setStartDate(date);
			setDateRange(`${formattedDate}-${oldEnd}`);
		} else {
			setEndDate(date);
			setDateRange(`${oldStart}-${formattedDate}`);
		}
	};

	const handleSearch = () => {
		const advStr = encodeURIComponent(JSON.stringify(searchTerms));
		navigate(
			`/${nextPage}?page=1&per_page=${numResults}&sort=${sortVal}` +
				`&date=${dateRange}&advanced=true&searches=${advStr}`,
		);
	};

	return (
		<>
			<NavBar />
			<div className="filters-container">
				<AdvancedSearch
					searchParams={searchParams}
					terms={terms}
					toggleReset={toggleReset}
					searchTerms={searchTerms}
					setSearchTerms={setSearchTerms}
				/>

				<div className="filters-card">
					<div className="filters-header">
						<h2>Filters</h2>
						<button type="button" className="reset-btn" onClick={handleReset}>
							Reset
						</button>
					</div>

					<div className="filters-row">
						<Sort order={order} setSortVal={setSortVal} sort={sortVal} />
						<Dropdown
							terms={results}
							setTerm={setNumResults}
							value="Per Page"
							term={numResults}
						/>
					</div>

					<div className="date-row">
						<div className="date-group">
							<label>Start Date</label>
							<DatePicker
								id="startDate"
								dateFormat="yyyy-MM-dd"
								selected={startDate}
								onChange={(date) => updateDateVal(date, "start")}
							/>
						</div>
						<div className="date-group">
							<label>End Date</label>
							<DatePicker
								id="endDate"
								dateFormat="yyyy-MM-dd"
								selected={endDate}
								onChange={(date) => updateDateVal(date, "end")}
							/>
						</div>
					</div>

					<div className="radio-row">
						<label>
							<input
								type="radio"
								name="searchType"
								value="papers"
								onChange={(e) => setNextPage(e.target.value)}
								checked={nextPage === "papers"}
							/>
							Papers
						</label>
						<label>
							<input
								type="radio"
								name="searchType"
								value="properties"
								onChange={(e) => setNextPage(e.target.value)}
								checked={nextPage === "properties"}
							/>
							Properties
						</label>
					</div>

					<div className="submit-row">
						<button
							type="button"
							className="primary-btn"
							onClick={handleSearch}
						>
							Search
						</button>
					</div>
				</div>
			</div>
		</>
	);
}

function Dropdown({ terms, setTerm, value, term }) {
	return (
		<div className="custom-dropdown">
			<button className="dropdown-button" type="button">
				{value}: <strong>{term}</strong> ▼
			</button>
			<div className="dropdown-content">
				{terms.map((option) => (
					<div
						key={option}
						className="dropdown-item"
						role="button"
						tabIndex={0}
						onClick={() => setTerm(option)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								setTerm(option);
							}
						}}
					>
						{option}
					</div>
				))}
			</div>
		</div>
	);
}

function Sort({ order, setSortVal, sort }) {
	return (
		<div className="custom-dropdown">
			<button className="dropdown-button" type="button">
				Sort: <strong>{sort.replace("-", " ")}</strong> ▼
			</button>
			<div className="dropdown-content">
				{order.map((option) => (
					<div
						key={option}
						className="dropdown-item"
						role="button"
						tabIndex={0}
						onClick={() => setSortVal(option.replace(" ", "-"))}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								setSortVal(option.replace(" ", "-"));
							}
						}}
					>
						{option.replace("-", " ")}
					</div>
				))}
			</div>
		</div>
	);
}

export default Filters;
