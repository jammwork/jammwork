import { Route, Routes } from "react-router-dom";

import EditorPage from "@/pages/EditorPage";

function App() {
	return (
		<Routes>
			<Route path="/" element={<EditorPage />} />
		</Routes>
	);
}

export default App;
