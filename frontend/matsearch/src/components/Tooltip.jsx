import { useState } from "react";
import "../styles/tooltip.css";

const Tooltip = ({ text }) => {
	const [visible, setVisible] = useState(false);

	return (
		<div
			className="tooltip-container"
			onMouseEnter={() => setVisible(true)}
			onMouseLeave={() => setVisible(false)}
		>
			<span className="tooltip-icon">?</span>
			{visible && <div className="tooltip-text">{text}</div>}
		</div>
	);
};

export default Tooltip;
