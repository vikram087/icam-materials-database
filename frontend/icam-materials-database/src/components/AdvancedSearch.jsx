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
		<div className="advanced-search-card">
			<h3>Advanced Search</h3>
			{searchTerms.map((item, index) => (
				<div
					key={`${index}_${item.term}_${item.field}`}
					className="as-search-row"
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
						className="as-search-input"
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
					<label className="vector-search-label">
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
						/>
						Vector
					</label>

					{/* Remove button (only on additional rows, not the first) */}
					{index > 0 && (
						<button
							type="button"
							className="remove-term-btn"
							onClick={() => removeSearchTerm(index)}
						>
							&times;
						</button>
					)}
				</div>
			))}

			<div className="as-btn-group">
				<button
					type="button"
					className="add-term-btn"
					onClick={addSearchTerm}
					disabled={
						query[0] === "all" ||
						query[0]?.trim() === "" ||
						query.some((val, index) => val.trim() === "all" && index !== 0)
					}
				>
					+ Add Term
				</button>
				{query[0].trim() === "all" && (
					<span style={{ marginLeft: 10 }}>
						Cannot add new terms or vector search with keyword "all"
					</span>
				)}
				{query.some((val, index) => val.trim() === "all" && index !== 0) && (
					<span style={{ marginLeft: 10 }}>
						Keyword "all" must be first term
					</span>
				)}
			</div>
		</div>
	);
}

function ASearchDropdown({ options, value, onChange }) {
	return (
		<div className="as-dropdown">
			<button type="button" className="as-dropdown-btn">
				{value} ▼
			</button>
			<div className="as-dropdown-menu">
				{options.map((option) => (
					<div
						key={option}
						className="as-dropdown-item"
						onClick={() => onChange(option)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								onChange(option);
							}
						}}
						role="button"
						tabIndex={0}
					>
						{option}
					</div>
				))}
			</div>
		</div>
	);
}

export default AdvancedSearch;
