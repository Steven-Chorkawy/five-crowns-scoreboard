import { JSX } from "react/jsx-runtime";
import "./App.css";

/**
 * Root component for the Five Crowns Scoreboard.
 *
 * This temporary page verifies that React, TypeScript, Vite, and the project
 * structure are working before the KendoReact user interface is introduced.
 *
 * @returns The initial project validation screen.
 */
function App(): JSX.Element {
  return (
    <div className="app-container">
      <h1>Five Crowns Scoreboard</h1>

      <p>Project setup complete.</p>
    </div>
  );
}

export default App;