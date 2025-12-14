import { useState } from "react";
import "../styles/filters.css";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import AdvancedSearch from "./AdvancedSearch";
import NavBar from "./navbar";

function Filters({ searchParams }) {
	const navigate = useNavigate();

	const [nextPage, setNextPage] = useState("papers");
	const [searchTerms, setSearchTerms] = useState(
		searchParams.searches || [
			{
				term: "all",
				field: "Abstract",
				operator: "AND",
				isVector: false,
			},
		],
	);

	const termsArr = searchParams.searches.map((val) => val.term);

	const [query, setQuery] = useState(termsArr || ["all"]);

	const [sortVal, setSortVal] = useState(
		searchParams.sorting || "Most-Relevant",
	);
	const [numResults, setNumResults] = useState(searchParams.per_page || 20);

	const results = [10, 20, 50, 100];
	const order = ["Most-Relevant", "Most-Recent", "Oldest-First"];

	const convertIntToDate = (dateNum) => {
		const dateString = String(dateNum);
		const year = dateString.substring(0, 4);
		const month = Number.parseInt(dateString.substring(4, 6), 10) - 1;
		const day = Number.parseInt(dateString.substring(6, 8), 10);

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
		setQuery(["all"]);
		setSearchTerms([
			{
				term: "all",
				field: "Abstract",
				operator: "AND",
				isVector: false,
			},
		]);
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
				`&date=${dateRange}&searches=${advStr}`,
		);
	};

	return (
		<>
			<NavBar />
			<div className="h-20" />
			<div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 py-8 px-6 lg:px-10">
				<div className="max-w-7xl mx-auto">
					<AdvancedSearch
						searchTerms={searchTerms}
						setSearchTerms={setSearchTerms}
						sortVal={sortVal}
						query={query}
						setQuery={setQuery}
					/>

					<div className="flex flex-col lg:flex-row gap-6 mt-6">
						{/* Main Filters Card */}
						<div className="flex-1 bg-white rounded-xl p-6 lg:p-8 shadow-elegant border border-gray-200">
							<div className="flex items-center justify-between mb-6">
								<h2 className="font-serif text-2xl lg:text-3xl font-bold text-slate-900">
									Filters
								</h2>
								<button
									type="button"
									className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold text-sm hover:bg-red-600 transition-all duration-300"
									onClick={handleReset}
								>
									Reset
								</button>
							</div>

							{/* Sort and Per Page Row */}
							<div className="flex flex-wrap gap-4 mb-6">
								<Sort order={order} setSortVal={setSortVal} sort={sortVal} />
								<Dropdown
									terms={results}
									setTerm={setNumResults}
									value="Per Page"
									term={numResults}
								/>
							</div>

							{/* Date Range */}
							<div className="flex flex-col sm:flex-row gap-4 mb-6">
								<div className="flex-1">
									<p className="block text-sm font-semibold text-gray-700 mb-2">
										Start Date
									</p>
									<DatePicker
										id="startDate"
										dateFormat="yyyy-MM-dd"
										selected={startDate}
										onChange={(date) => updateDateVal(date, "start")}
										className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 transition-all duration-300"
									/>
								</div>
								<div className="flex-1">
									<p className="block text-sm font-semibold text-gray-700 mb-2">
										End Date
									</p>
									<DatePicker
										id="endDate"
										dateFormat="yyyy-MM-dd"
										selected={endDate}
										onChange={(date) => updateDateVal(date, "end")}
										className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 transition-all duration-300"
									/>
								</div>
							</div>

							{/* Next Page Radio Buttons */}
							<div className="mb-6">
								<p className="text-sm font-semibold text-gray-700 mb-3">
									Next Page:
								</p>
								<div className="flex flex-col sm:flex-row gap-4">
									<label className="flex items-center gap-2 cursor-pointer">
										<input
											type="radio"
											name="searchType"
											value="papers"
											onChange={(e) => setNextPage(e.target.value)}
											checked={nextPage === "papers"}
											className="w-4 h-4 text-slate-900 focus:ring-slate-900"
										/>
										<span className="text-sm text-gray-700">
											Papers (traditional search format)
										</span>
									</label>
									<label className="flex items-center gap-2 cursor-pointer">
										<input
											type="radio"
											name="searchType"
											value="properties"
											onChange={(e) => setNextPage(e.target.value)}
											checked={nextPage === "properties"}
											className="w-4 h-4 text-slate-900 focus:ring-slate-900"
										/>
										<span className="text-sm text-gray-700">
											Properties (table format)
										</span>
									</label>
								</div>
							</div>

							{/* Submit Button */}
							<div className="flex justify-end pt-4 border-t border-gray-200">
								<button
									type="button"
									className="px-8 py-3 bg-slate-900 text-white rounded-lg font-semibold text-base hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
									onClick={handleSearch}
									disabled={query.some(
										(val, index) =>
											val.trim() === "" ||
											(val.trim() === "all" && index !== 0),
									)}
								>
									Search
								</button>
							</div>
						</div>

						{/* Info Panel */}
						<div className="lg:w-96 bg-white rounded-xl p-6 shadow-elegant border border-gray-200">
							<h3 className="font-serif text-xl font-bold text-slate-900 mb-4 pb-3 border-b-2 border-gray-200">
								Advanced Search Guide
							</h3>
							<ul className="space-y-3 text-sm text-gray-700 leading-relaxed">
								<li className="flex gap-2">
									<span className="text-red-500 font-bold">•</span>
									<span>
										Enter a search term and select a field (e.g.,{" "}
										<strong>Abstract, Title, Authors</strong>).
									</span>
								</li>
								<li className="flex gap-2">
									<span className="text-red-500 font-bold">•</span>
									<span>
										Use logical operators (<strong>AND, OR, NOT</strong>) to
										refine your query.
									</span>
								</li>
								<li className="flex gap-2">
									<span className="text-red-500 font-bold">•</span>
									<span>
										Enable <strong>Vector Search</strong> for more relevant
										results (only one term allowed).
									</span>
								</li>
								<li className="flex gap-2">
									<span className="text-red-500 font-bold">•</span>
									<span>
										You cannot use <strong>Vector Search</strong> with query{" "}
										<strong>"all"</strong>, for{" "}
										<strong>Authors/Category</strong> fields, and for any
										operator besides <strong>AND</strong>.
									</span>
								</li>
								<li className="flex gap-2">
									<span className="text-red-500 font-bold">•</span>
									<span>
										The <strong>"all"</strong> keyword must be the first and
										only term when used.
									</span>
								</li>
								<li className="flex gap-2">
									<span className="text-red-500 font-bold">•</span>
									<span>
										The <strong>"all"</strong> keyword shows all results and is
										the default query.
									</span>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

function Dropdown({ terms, setTerm, value, term }) {
	return (
		<label className="inline-flex items-center gap-2">
			<span className="text-sm font-medium text-gray-700">{value}:</span>

			<select
				value={term}
				onChange={(e) => setTerm(e.target.value)}
				className="px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm font-medium text-slate-900
					hover:bg-white hover:border-gray-300
					focus:outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10
					transition-all duration-300"
			>
				{terms.map((option) => (
					<option key={option} value={option}>
						{option}
					</option>
				))}
			</select>
		</label>
	);
}

function Sort({ order, setSortVal, sort }) {
	return (
		<label className="inline-flex items-center gap-2">
			<span className="text-sm font-medium text-gray-700">Sort:</span>

			<select
				value={sort}
				onChange={(e) => setSortVal(e.target.value)}
				className="px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm font-medium text-slate-900
					hover:bg-white hover:border-gray-300
					focus:outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10
					transition-all duration-300"
			>
				{order.map((option) => (
					<option key={option} value={option}>
						{option.replace("-", " ")}
					</option>
				))}
			</select>
		</label>
	);
}

export default Filters;
