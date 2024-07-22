"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Highlight, themes } from "prism-react-renderer";
import Prism from "prismjs";
import "prismjs/components/prism-python";

interface Variables {
	fruits?: string[];
	fruit?: string;
}

type PrismToken = Prism.Token;
type TokenStream = string | PrismToken | Array<string | PrismToken>;

interface ExecutionState {
	code: string;
	output: string;
	currentLine: number;
	variables: Variables;
	error: string;
	executionMode: "idle" | "stepped" | "running";
	executionStep: number;
	currentFruitIndex: number;
}

const PythonForInLoopExplorer: React.FC = () => {
	const [executionState, setExecutionState] = useState<ExecutionState>({
		code: `basket = ["사과", "바나나", "체리"]
for hand in basket:
    print(hand)`,
		output: "",
		currentLine: 0,
		variables: {},
		error: "",
		executionMode: "idle",
		executionStep: 0,
		currentFruitIndex: -1,
	});

	const outputRef = useRef<HTMLPreElement>(null);

	useEffect(() => {
		if (outputRef.current) {
			outputRef.current.scrollTop = outputRef.current.scrollHeight;
		}
	}, [executionState.output]);

	const parseAndExecuteCode = (stepMode: boolean = false): void => {
		setExecutionState((prevState) => {
			const newState = { ...prevState };
			newState.error = "";
			newState.output = "";
			newState.variables = {};
			newState.currentLine = 0;
			newState.executionStep = 0;
			newState.currentFruitIndex = -1;
			newState.executionMode = stepMode ? "stepped" : "running";

			const lines: string[] = newState.code.split("\n");
			let vars: Variables = {};

			try {
				const firstLine: string = lines[0].trim();
				if (firstLine.startsWith("basket =")) {
					const fruitsStr: string = firstLine.split("=")[1].trim();
					vars.fruits = JSON.parse(fruitsStr.replace(/'/g, '"'));
					newState.variables = vars;
				} else {
					throw new Error("첫 번째 줄은 'fruits =' 로 시작하는 리스트 할당이어야 합니다");
				}

				if (!stepMode) {
					let out: string = "";
					for (let fruit of vars.fruits!) {
						out += fruit + "\n";
					}
					newState.output = out;
					newState.currentLine = lines.length - 1;
					newState.executionMode = "idle";
				} else {
					newState.executionStep = 1;
				}
			} catch (err) {
				newState.error = err instanceof Error ? err.toString() : "알 수 없는 오류가 발생했습니다";
				newState.executionMode = "idle";
			}

			return newState;
		});
	};

	const nextStep = (): void => {
		if (executionState.executionMode !== "stepped") {
			parseAndExecuteCode(true);
			return;
		}

		setExecutionState((prevState) => {
			const newState = { ...prevState };
			const vars = { ...newState.variables };
			let out = newState.output;

			switch (newState.executionStep) {
				case 0: // 초기 상태
					newState.currentLine = 0;
					newState.executionStep = 1;
					break;
				case 1: // fruits 리스트 정의
					newState.currentLine = 1;
					newState.executionStep = 2;
					break;
				case 2: // for 루프 시작
					newState.currentLine = 1;
					const newIndex: number = newState.currentFruitIndex + 1;
					if (newIndex < (vars.fruits?.length ?? 0)) {
						newState.currentFruitIndex = newIndex;
						newState.executionStep = 3;
					} else {
						newState.executionStep = 6; // 루프 종료
					}
					break;
				case 3: // fruit 변수에 값 할당
					vars.fruit = vars.fruits![newState.currentFruitIndex];
					newState.variables = vars;
					newState.currentLine = 1;
					newState.executionStep = 4;
					break;
				case 4: // print 문 실행 및 출력
					out += vars.fruit + "\n";
					newState.output = out;
					newState.currentLine = 2;
					newState.executionStep = 5;
					break;
				case 5: // 루프 시작으로 돌아감
					newState.currentLine = 1;
					newState.executionStep = 2;
					break;
					break;
				case 6: // 루프 종료
					newState.currentLine = 3;
					newState.executionMode = "idle";
					break;
			}

			return newState;
		});
	};

	const reset = (): void => {
		setExecutionState((prevState) => ({
			...prevState,
			output: "",
			currentLine: 0,
			variables: {},
			error: "",
			executionStep: 0,
			currentFruitIndex: -1,
			executionMode: "idle",
		}));
	};

	const getExplanation = (): string => {
		const { executionStep, currentFruitIndex, variables } = executionState;
		switch (executionStep) {
			case 0:
				return "과일 탐색을 시작해볼까요?";
			case 1:
				return "과일 바구니(basket)가 준비됐어요! 이제 for 문을 시작해서 과일을 하나씩 확인해볼까요?";
			case 2:
				return currentFruitIndex + 1 < (variables.fruits?.length ?? 0)
					? `${currentFruitIndex + 2}번째 과일을 살펴볼 차례예요. 어떤 과일일까요?`
					: "와! 모든 과일을 다 살펴봤어요. 이제 for 문을 마칠 시간이에요.";
			case 3:
				return `'바구니(basket)'에서 '${variables.fruits?.[currentFruitIndex]}'를 '손(hand)'으로 꺼냈어요. 과일은 현재 '손(hand)에 있어요.`;
			case 4:
				return `이제 다음 줄로 넘어가 '손(hand)' 안에 어떤 과일을 쥐고 있는지 출력해볼 거예요.`;
			case 5:
				return `'손(hand)'에 쥐고 있는 '${variables.fruit}'가 출력됐어요. 결과 창을 확인해보세요!`;
			case 6:
				return "모든 과일을 다 확인해봤어요. 과일 탐색 끝!";
			default:
				return "과일 탐색을 시작해볼까요?";
		}
	};

	const atomOneDarkStyle = {
		backgroundColor: "#282c34",
		color: "#abb2bf",
		fontFamily: '"Fira Code", "Fira Mono", monospace',
		fontSize: "14px",
		lineHeight: "1.5",
	};

	const getTokenStyle = (type: string): React.CSSProperties => {
		switch (type) {
			case "keyword":
				return { color: "#c678dd" };
			case "string":
				return { color: "#98c379" };
			case "number":
				return { color: "#d19a66" };
			case "comment":
				return { color: "#5c6370", fontStyle: "italic" };
			default:
				return {};
		}
	};

	const tokenToReact = (token: TokenStream, key: number): React.ReactNode => {
		if (typeof token === "string") {
			return <span key={key}>{token}</span>;
		}
		if (Array.isArray(token)) {
			return <span key={key}>{token.map((t, i) => tokenToReact(t, i))}</span>;
		}
		return (
			<span key={key} className={`token ${token.type}`} style={getTokenStyle(token.type)}>
				{tokenToReact(token.content, 0)}
			</span>
		);
	};

	const highlightCode = (): JSX.Element => {
		const { code, currentLine, currentFruitIndex, variables } = executionState;
		const lines = code.split("\n");

		return (
			<pre style={atomOneDarkStyle} className="rounded-md p-4">
				{lines.map((line, lineIndex) => {
					const tokens = Prism.tokenize(line, Prism.languages.python);
					const lineStyle =
						lineIndex === currentLine ? { backgroundColor: "rgba(59, 130, 246, 0.5)" } : {};

					return (
						<div key={lineIndex} style={lineStyle}>
							{tokens.map((token, tokenIndex) => {
								if (typeof token !== "string" && token.type === "string" && lineIndex === 0) {
									const content = token.content;
									if (typeof content === "string") {
										const fruitIndex = variables.fruits?.findIndex(
											(fruit) => fruit === content.replace(/['"]/g, "")
										);
										if (fruitIndex === currentFruitIndex) {
											return (
												<span
													key={tokenIndex}
													className={`token ${token.type}`}
													style={{
														...getTokenStyle(token.type),
														backgroundColor: "#89702C",
													}}
												>
													{content}
												</span>
											);
										}
									}
								}
								return tokenToReact(token, tokenIndex);
							})}
						</div>
					);
				})}
			</pre>
		);
	};

	const renderVariables = (): JSX.Element => {
		const { variables, currentFruitIndex } = executionState;
		if (!variables.fruits) {
			return <div className="text-gray-400">표시할 변수가 없습니다</div>;
		}

		const variablesCode = `basket = ${JSON.stringify(variables.fruits)}
hand = ${
			variables.fruits?.[currentFruitIndex] !== undefined
				? `"${variables.fruits?.[currentFruitIndex]}"`
				: "undefined"
		}`;

		return (
			<Highlight theme={themes.nightOwl} code={variablesCode} language="python">
				{({ className, style, tokens, getLineProps, getTokenProps }) => (
					<pre className={className} style={{ ...style, ...atomOneDarkStyle }}>
						{tokens.map((line, i) => (
							<div {...getLineProps({ line, key: i })} key={String(line) + i + "2"}>
								{line.map((token, key) => {
									let tokenProps = getTokenProps({ token, key });
									if (token.types.includes("string")) {
										const fruitIndex = variables.fruits?.findIndex(
											(fruit) => fruit === token.content.replace(/['"]/g, "")
										);
										if (fruitIndex === currentFruitIndex) {
											tokenProps.className += " bg-yellow-500 bg-opacity-50";
										}
									}
									return <span {...tokenProps} key={String(line) + i + "!"} />;
								})}
							</div>
						))}
					</pre>
				)}
			</Highlight>
		);
	};

	return (
		<div className="max-w-4xl mx-auto p-6 space-y-6 bg-gray-100 text-gray-900">
			<h1 className="text-3xl font-bold text-gray-800">파이썬 for in 루프 탐색기</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>코드</CardTitle>
					</CardHeader>
					<CardContent>
						<ScrollArea
							className="h-[200px] w-full rounded-md border border-gray-700 p-[2px]"
							style={atomOneDarkStyle}
						>
							{highlightCode()}
						</ScrollArea>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>변수들</CardTitle>
					</CardHeader>
					<CardContent>
						<ScrollArea
							className="h-[200px] w-full rounded-md border border-gray-700 p-4"
							style={atomOneDarkStyle}
						>
							{renderVariables()}
						</ScrollArea>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>설명</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="bg-[#282C34] py-2 px-3 rounded-md text-white">{getExplanation()}</p>
				</CardContent>
			</Card>

			{executionState.error && (
				<Card className="bg-red-100 border-red-300">
					<CardHeader>
						<CardTitle className="text-red-800">오류</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-red-700">{executionState.error}</p>
					</CardContent>
				</Card>
			)}

			<div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
				<div className="space-x-2">
					<Button onClick={() => parseAndExecuteCode(false)} variant="default">
						전체 실행
					</Button>
					<Button onClick={nextStep} variant="secondary" className="border border-zinc-400">
						다음 단계
					</Button>
					<Button onClick={reset} variant="outline">
						처음부터
					</Button>
				</div>
				<div className="text-sm font-medium text-gray-600">
					{executionState.executionMode === "idle"
						? "단계 모드"
						: executionState.executionMode === "stepped"
						? "단계 모드"
						: "실행 모드"}
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>결과</CardTitle>
				</CardHeader>
				<CardContent>
					<ScrollArea className="h-[200px] w-full rounded-md border bg-zinc-800">
						<pre ref={outputRef} className="p-4 font-mono text-sm text-white whitespace-pre-wrap">
							{executionState.output.split("\n").map((line, index) => (
								<React.Fragment key={index}>
									{line}
									{index < executionState.output.split("\n").length - 1 && <br />}
								</React.Fragment>
							))}
						</pre>
					</ScrollArea>
				</CardContent>
			</Card>
		</div>
	);
};

export default PythonForInLoopExplorer;
