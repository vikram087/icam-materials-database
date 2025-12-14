import parse from "html-react-parser";
import DOMPurify from "dompurify";
import { MathJax, MathJaxContext } from "better-react-mathjax";

function Content({ content, mode = "both" }) {
	const config = {
		loader: { load: ["[tex]/html"] },
		tex: {
			packages: { "[+]": ["html"] },
			inlineMath: [
				["$", "$"],
				["\\(", "\\)"],
			],
			displayMath: [
				["$$", "$$"],
				["\\[", "\\]"],
			],
		},
	};

	const sanitizedContent = DOMPurify.sanitize(content);
	const parsedContent = parse(sanitizedContent);

	if (mode === "highlightOnly") {
		return <>{parsedContent}</>;
	}

	if (mode === "mathOnly") {
		return (
			<MathJaxContext version={3} config={config}>
				<span style={{ display: "inline" }}>
					<MathJax inline hideUntilTypeset="first">
						{sanitizedContent}
					</MathJax>
				</span>
			</MathJaxContext>
		);
	}

	return (
		<MathJaxContext version={3} config={config}>
			<span style={{ display: "inline" }}>
				<MathJax inline hideUntilTypeset="first">
					{parsedContent}
				</MathJax>
			</span>
		</MathJaxContext>
	);
}

export default Content;
