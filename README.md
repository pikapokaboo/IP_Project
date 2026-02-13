# The Archivist

The Archive is a narrative horror investigation game presented as a secret CAC (Central Archival Committee) terminal experience. Players take the role of a newly hired archivist assigned to investigate unstable artifacts through controlled containment tests. By observing clues, making high-stakes environmental decisions, and surviving each trial, players recover redacted protocol fragments and gradually rebuild the missing archive files. Every choice has consequences, so the gameplay rewards attention, deduction, and composure under pressure.

This project is designed for players who enjoy story-rich mystery games, branching outcomes, and atmospheric tension over pure action. What makes it compelling is the mix of immersive worldbuilding and system-driven progression: each successful test reveals new lore, increases clearance, and unlocks deeper layers of the artifact’s truth. Instead of just “winning levels,” players feel like they are piecing together forbidden knowledge, making The Archive both replayable and memorable.

---

## Design Process
The idea for this game was inspired by our collective fascination with the SCP framework and, more specifically, the intrigue of recording and containing objects and events where the origins are completely unknown. We wanted to incorporate this sense of controlled and methodical investigation, where players gradually uncover new levels of truth through observation, investigation, and decision-making. Our goal from the beginning was to build a game that was tense and immersive, with a high level of lore, as opposed to non-stop action.

As a team, we have a collective love of visual novels, and we decided to use this format to present the story through dialogue and world-building. This format allows players to become immersed in each and every artifact investigation and experience the true consequences of their decisions. As a way to keep players interested and to increase replay value, we have incorporated various progression tools, such as achievements and archive clearance. These tools are obvious goals but also offer the player a sense of exploration and completion of every investigation path.

### Target Users
- Players aged roughly 15-30 who enjoy narrative-driven mystery/horror games.
- Students and casual gamers who prefer choice-based gameplay over fast reflex combat.
- Story-focused players who like uncovering lore, hidden details, and branching outcomes.
- Completionist players motivated by progression systems (clearance %, archive completion, full test clears).
- Puzzle/deduction players who enjoy analyzing clues and making strategic decisions under pressure.

### User Goals
- Experience a tense, story-rich mystery with meaningful choices.
- Understand each artifact’s behavior and complete investigations successfully.
- Feel progression through clear milestones (archive completion, clearance, achievements).
- Replay tests to discover different outcomes, dialogue paths, and hidden lore.
- Enjoy an accessible game loop that is easy to start but rewarding to master.

### How This Project Meets Those Goals
- Branching visual-novel choices create direct consequences, making decisions feel meaningful.
- Each test is built around clue reading and deduction (light, sound, power, timing), supporting investigative gameplay.
- Progress systems like protocol fragment unlocks, archive percentages, and achievements give constant feedback and motivation.
- Fail/pass outcomes encourage replay and experimentation, increasing long-term engagement.
- The interface and test structure are straightforward for casual players, while layered conditions provide depth for mastery-focused players.

### User Stories

- As a **new player**, I want to see a clear intro and warning screen, so that I know the game tone and content before starting.
- As a **player**, I want to log in quickly, so that I can access my own progress and continue where I left off.
- As a **story-focused player**, I want to read immersive dialogue and narration, so that I can understand the lore and world of CAC.
- As a **decision-making player**, I want to choose between multiple containment actions, so that my choices meaningfully affect outcomes.
- As a **strategy player**, I want immediate pass/fail feedback after decisions, so that I can learn artifact behavior and improve.
- As a **completionist**, I want to unlock protocol fragments and archive percentages, so that I can track my progress toward full completion.
- As an **achievement-focused player**, I want achievements for key milestones, so that I feel rewarded for mastering all investigations.
- As a **returning player**, I want my progress saved automatically, so that I do not lose completed tests or unlocks.
- As a **casual player**, I want simple navigation between home, archive, and test modes, so that I can play without confusion.
- As a **replay-oriented player**, I want to retry tests after failure, so that I can explore different paths and outcomes.

### Wireframes / Mockups / Diagrams
- Wireframes PDF: `[path/to/file.pdf]`
- Adobe XD folder: `[path/to/xd-folder]`
- Adobe XD share URL: `[paste url here]`
- Other diagrams: `[path/to/diagram]`

---

## Features

### Existing Features

- **Terminal-style Login Flow** - allows users to enter the game world immersively, by presenting a CAC-themed startup/login sequence before gameplay.
- **Branching Choice System** - allows users to influence story outcomes, by selecting containment actions during each investigation test.
- **Archive Progression System** - allows users to track achievement and completion, by unlocking protocol fragments and increasing clearance percentages after correct decisions.
- **Pass/Fail Test Outcomes** - allows users to learn from consequences, by triggering immediate success or failure states based on their choices.

### Features Left to Implement
- Add More objects
- Add more gameplay to the visual novel

---

## Technologies Used

- **HTML5** - <https://developer.mozilla.org/en-US/docs/Web/HTML>  
  Used to structure all pages, UI sections, forms, and story containers.

- **CSS3** - <https://developer.mozilla.org/en-US/docs/Web/CSS>  
  Used for styling, layout, animations, and responsive presentation of the terminal/visual novel interface.

- **JavaScript (Vanilla ES6+)** - <https://developer.mozilla.org/en-US/docs/Web/JavaScript>  
  Used to implement game logic, branching story flow, audio handling, UI state, and progression systems.

- **Web Storage API (`localStorage` / `sessionStorage`)** - <https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API>  
  Used to store account/session data, test progress, fail counts, and unlocked achievements.

- **Fetch API** - <https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API>  
  Used to load story JSON files and archive text files dynamically, and to communicate with cloud database endpoints.

- **Web Crypto API (SHA-256)** - <https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API>  
  Used to hash user passwords before sending/storing authentication data.

- **RestDB.io** - <https://restdb.io/>  
  Used as the backend database service for account-related data (e.g., login/signup records).

- **LottieFiles Web Player** - <https://github.com/LottieFiles/lottie-player>  
  Used to display the animated loading sequence via JSON-based animation.

- **Sketchfab Embed** - <https://sketchfab.com/developers/viewer>  
  Used to display interactive 3D artifact models inside the archive/object interface.

---

## Assistive AI

Document all AI usage clearly to avoid mark deductions.

### AI Usage Log
| Tool | What it helped with | Output used? | What was changed by me | Evidence |
|---|---|---|---|---|
| ChatGPT | Restdb login API | Partially | I used ChatGPT to give me some code alterations for the RestDB API and to give me a rough template for calling the API from RestDB | `Screenshots/ChatGPT.png` |
| ChatGPT | Sketchfab integration | Partially | I used ChatGPT guide me in implementing the 3D models from sketchfab | `Screenshots/gpt_sketchfab` `Screenshots/gpt_sketchfab_2` |

### AI Screenshots
#### Screenshot 1
- ![Screenshot 1](Screenshots/ChatGPT.png)
#### Screenshot 2
- ![Screenshot 2](Screenshots/gpt_sketchfab)
#### Screenshot 3
- ![Screenshot 3](Screenshots/gpt_sketchfab_2)

---

## Testing

### Manual Testing Scenarios

#### [Feature Name / Page Name]
1. Go to `[page/section]`.
2. Perform `[test action]`.
3. Verify that `[expected result]`.

#### [Feature Name / Page Name]
1. Go to `[page/section]`.
2. Perform `[test action]`.
3. Verify that `[expected result]`.

### User Story Testing
- **User Story:** As a [user type], I want to [action], so that [goal].  
  **Test:** [How you tested it]  
  **Result:** [Pass/Fail + notes]

- **User Story:** As a [user type], I want to [action], so that [goal].  
  **Test:** [How you tested it]  
  **Result:** [Pass/Fail + notes]

### Browser and Device Testing
- Chrome: [Pass/Issues]
- Edge: [Pass/Issues]
- Firefox: [Pass/Issues]
- Safari: [Pass/Issues]
- Mobile (Android/iOS): [Pass/Issues]
- Screen sizes tested: [e.g. 320px, 768px, 1024px, 1440px]

### Bugs / Known Issues
- [Bug 1 description + status]
- [Bug 2 description + status]
- [Bug 3 description + status]

> If this section becomes too long, move it to `TESTING.md` and link it here.

---

## Credits

### Content
- [Text/source attribution, e.g. references used]

### Media
- [Images/audio/video source attribution]

### Code / References
- [Tutorial/documentation/reference URLs]

### Acknowledgements
- [Inspiration, mentors, classmates, etc.]
