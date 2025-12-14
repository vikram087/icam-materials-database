import { useEffect } from "react";
import "../styles/filters.css";

function AdvancedSearch({
	searchTerms,
	setSearchTerms,
	sortVal,
	query,
	setQuery,
}) {
	const terms = [
		"Abstract",
		"Title",
		"Authors",
		"Category",
		"Material",
		"Description",
		"Symmetry or Phase Labels",
		"Synthesis",
		"Characterization",
		"Property",
		"Application",
	];

	useEffect(() => {
		setSearchTerms((prev) => {
			const updatedTerms = prev.map((termObj) => ({
				...termObj,
				isVector: termObj.isVector
					? (termObj.field === "Abstract" || termObj.field === "Title") &&
						termObj.operator === "AND" &&
						termObj.term !== "all"
					: false,
			}));

			if (JSON.stringify(updatedTerms) !== JSON.stringify(prev)) {
				return updatedTerms;
			}
			return prev;
		});
	}, [searchTerms]);

	const addSearchTerm = () => {
		setSearchTerms((prev) => [
			...prev,
			{
				term: "",
				field: terms[0],
				operator: "AND",
				isVector: false,
			},
		]);
	};

	const updateSearchTerm = (id, key, value) => {
		setSearchTerms((prev) =>
			prev.map((item, index) =>
				index === id ? { ...item, [key]: value } : item,
			),
		);
	};

	const removeSearchTerm = (id) => {
		setSearchTerms((prev) => prev.filter((_, index) => index !== id));
		setQuery((prev) => prev.filter((_, index) => index !== id));
	};

	const toggleVectorSearch = (id) => {
		setSearchTerms((prev) =>
			prev.map((item, index) =>
				index === id
					? { ...item, isVector: !item.isVector }
					: { ...item, isVector: false },
			),
		);
	};

	const changeQuery = (newValue, index) => {
		setQuery((prevQuery) => {
			const updatedQuery = [...prevQuery];
			updatedQuery[index] = newValue;
			return updatedQuery;
		});
	};

	return (
		<div className="bg-white rounded-xl p-6 lg:p-8 shadow-elegant border border-gray-200">
			<h3 className="font-serif text-2xl lg:text-3xl font-bold text-slate-900 mb-6">
				Advanced Search
			</h3>

			{searchTerms.map((item, index) => (
				<div
					key={`${index}_${item.term}_${item.field}`}
					className="flex flex-wrap items-center gap-3 mb-4"
				>
					{/* Operator for rows after the first */}
					{index > 0 && (
						<ASearchDropdown
							options={["AND", "OR", "NOT"]}
							value={item.operator}
							onChange={(value) => updateSearchTerm(index, "operator", value)}
						/>
					)}

					{/* Search Term Input */}
					<input
						type="text"
						className="flex-1 min-w-50 px-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 transition-all duration-300"
						placeholder={`Search term #${index + 1}`}
						value={query[index] ?? ""}
						onChange={(e) => changeQuery(e.target.value, index)}
						onBlur={(e) => updateSearchTerm(index, "term", e.target.value)}
					/>

					{/* Field Dropdown (Abstract, Title, etc.) */}
					<ASearchDropdown
						options={terms}
						value={item.field}
						onChange={(value) => updateSearchTerm(index, "field", value)}
					/>

					{/* Vector Search Checkbox */}
					<label className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors duration-200">
						<input
							type="checkbox"
							disabled={
								query[0] === "all" ||
								sortVal !== "Most-Relevant" ||
								(searchTerms[index].field !== "Abstract" &&
									searchTerms[index].field !== "Title") ||
								searchTerms[index].operator !== "AND"
							}
							checked={
								item.isVector &&
								sortVal === "Most-Relevant" &&
								(searchTerms[index].field === "Title" ||
									searchTerms[index].field === "Abstract") &&
								searchTerms[index].operator === "AND"
							}
							onChange={() => toggleVectorSearch(index)}
							className="w-4 h-4 text-slate-900 focus:ring-slate-900 rounded"
						/>
						<span className="text-sm font-medium text-gray-700">Vector</span>
					</label>

					{/* Remove button (only on additional rows, not the first) */}
					{index > 0 && (
						<button
							type="button"
							className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300 font-bold text-lg leading-none"
							onClick={() => removeSearchTerm(index)}
						>
							×
						</button>
					)}
				</div>
			))}

			<div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-gray-200">
				<button
					type="button"
					className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-all duration-300 disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400"
					onClick={addSearchTerm}
					disabled={
						query[0] === "all" ||
						query[0]?.trim() === "" ||
						query.some((val, index) => val.trim() === "all" && index !== 0)
					}
				>
					+ Add Term
				</button>
				{query[0]?.trim() === "all" && (
					<span className="text-sm text-gray-600">
						Cannot add new terms or vector search with keyword "all"
					</span>
				)}
				{query.some((val, index) => val.trim() === "all" && index !== 0) && (
					<span className="text-sm text-gray-600">
						Keyword "all" must be first term
					</span>
				)}
			</div>
		</div>
	);
}

function ASearchDropdown({ options, value, onChange }) {
	return (
		<select
			value={value}
			onChange={(e) => onChange(e.target.value)}
			className="px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700
				hover:bg-white hover:border-gray-300
				focus:outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10
				transition-all duration-300 whitespace-nowrap"
		>
			{options.map((option) => (
				<option key={option} value={option}>
					{option}
				</option>
			))}
		</select>
	);
}

export default AdvancedSearch;
