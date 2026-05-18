# 🎰 Blackjack Table Web App

> **Fully Vibecoded with Claude 3.5 Sonnet** — A production-ready, casino-grade blackjack table built entirely through AI-assisted code generation and refined iteratively for optimal gameplay.

## 📋 Development Journey

### Model & Approach
This project was **fully vibecoded** using **Claude 3.5 Sonnet**, Anthropic's latest frontier model for coding tasks. The development followed an iterative, specification-driven approach:

#### Step 1: Comprehensive Feature Specification
The initial prompt defined all requirements in detail:
- 🪑 **Table Layout**: 5 independent seats with multi-hand support
- 🃏 **Core Gameplay**: Full blackjack rules, dealer logic, hand evaluation
- 💰 **Betting System**: Dynamic chip denominations, balance persistence
- 🌐 **State Management**: URL routing, localStorage persistence
- 🎨 **UI/UX**: Casino aesthetic, smooth animations, responsive design
- 🧱 **Tech Stack**: Vanilla JavaScript, no dependencies

#### Step 2: AI-Driven Architecture Design
Claude 3.5 Sonnet analyzed the requirements and proposed:
- **Object-Oriented Structure**: `Deck`, `Hand`, `Game`, `GameUI` classes
- **Separation of Concerns**: Game engine (deck.js) separate from UI controller (game.js)
- **6-Deck Shoe Implementation**: Casino-standard card management with auto-reshuffle
- **State Management Pattern**: Centralized game state with localStorage sync

#### Step 3: Core Engine Development
The AI generated the complete game logic:
- `Deck` class with shuffle/draw mechanics and discard pile management
- `Hand` class with blackjack-specific rules (pair detection, value calculation with Aces)
- `Game` class implementing full blackjack rules:
  - Dealer logic (hit on 16, stand on 17+)
  - Hand evaluation (bust, blackjack, win/loss/push)
  - Split and double-down support
  - Per-hand settlement calculation
  - Proper 3:2 payout for natural blackjacks

#### Step 4: UI/UX Implementation
Claude crafted:
- **Semantic HTML5** structure for accessibility
- **CSS Casino Aesthetic**:
  - Green felt background with radial gradients
  - Gold accents and trim
  - Professional card rendering (♠ ♥ ♦ ♣)
  - Smooth animations for dealing and chip placement
- **Responsive Design**: Mobile-first approach supporting screens from 320px to 1400px+
- **Dark Theme**: Eye-friendly interface with vibrant highlights

#### Step 5: Event-Driven Controller
The AI synthesized a robust UI controller:
- Event delegation for all player actions
- Real-time game state visualization
- Balance management with localStorage persistence
- URL parameter synchronization
- Chip animation effects on betting

#### Step 6: Refinement & Edge Cases
Through iterative prompting, Claude addressed:
- Insufficient balance handling
- Multi-hand split management
- Proper bet doubling for splits
- Dealer hole card reveal timing
- Hand status transitions (null → stand → bust → resolved)
- Cross-seat independence verification

#### Step 7: Confirmation & Documentation
Final acceptance confirmed that all 8+ major features were:
- ✅ Fully implemented
- ✅ Production-ready
- ✅ Cross-browser compatible
- ✅ Performant and maintainable
- ✅ Well-documented in code

---

## 🎯 Features

### 🪑 Table Layout & Seating
- **5 Independent Seats** — Play up to 5 hands simultaneously
- **Multi-Hand Support** — Split pairs into independent hands
- **Responsive Seats** — Each seat has betting area, card zone, and action buttons
- **Visual Status** — Clear indicators: ACTIVE, BUSTED, WON, LOST, PUSH, BLACKJACK!

### 🃏 Core Gameplay
- **Authentic Blackjack Rules**:
  - Dealer hits on 16, stands on 17+
  - Player wins with 21 or when dealer busts
  - Blackjack (natural 21) pays 3:2
  - Push (tie) returns the bet
- **All Standard Actions**:
  - **Hit** — Draw another card
  - **Stand** — Keep current hand and move to next
  - **Double Down** — Double bet and receive exactly one more card
  - **Split** — Split a pair into two independent hands
- **Hand Resolution** — Each hand independently evaluated against dealer
- **Proper Card Valuation** — Automatic Ace adjustment (11 or 1)

### 💰 Balance & Betting System
- **Starting Balance** — $1,000 (persisted in browser storage)
- **Chip Selection** — $5, $25, $50, $100, $500 denominations
- **Dynamic Betting** — Click chips to add to seat's bet
- **Bet Clearing** — Remove bets before dealing
- **Balance Protection** — Cannot bet more than available
- **Auto-Calculation** — Wins/losses update balance immediately
- **Refill Button** — Reset balance to $1,000 anytime

### 🌐 State Management & Routing
- **URL Parameters** — `?seats=1,3,5` reflects active seats
- **localStorage Persistence** — Balance survives page refresh
- **Game State Sync** — URL updates as you place bets
- **Session Recovery** — Game preferences stored locally

### 🎨 Visual Design
- **Casino Aesthetic** — Green felt with gold trim
- **Card Rendering** — Full Unicode suit symbols with proper colors
- **Smooth Animations**:
  - Card dealing (scale + rotation + fade)
  - Chip placement bounces
  - Hover effects on all controls
  - Status transitions with color coding
- **Dark Theme** — Eye-friendly dark interface with vibrant accents
- **Fully Responsive** — Works on desktop, tablet, and mobile

---

## 🚀 Quick Start

### Installation
```bash
# 1. Clone or download the repository
git clone https://github.com/magnificentdud/Blackjack-Table-Web-App.git
cd Blackjack-Table-Web-App

# 2. Open in browser
open index.html
# or just double-click index.html