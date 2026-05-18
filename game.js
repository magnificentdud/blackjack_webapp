/**
 * Game UI Controller
 */
class GameUI {
    constructor() {
        this.game = new Game();
        this.balance = this.loadBalance();
        this.selectedChip = 5;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateBalanceDisplay();
        this.updateURL();
    }

    setupEventListeners() {
        // Chip selection
        document.querySelectorAll('.chip-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                this.selectedChip = parseInt(e.target.dataset.value);
                document.getElementById('selectedChip').textContent = `$${this.selectedChip}`;
            });
        });

        // Add chip to seats
        document.querySelectorAll('.btn-add-chip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const seatIndex = parseInt(e.target.dataset.seat);
                this.addChipToSeat(seatIndex);
            });
        });

        // Clear bets
        document.querySelectorAll('.btn-clear-bet').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const seatIndex = parseInt(e.target.dataset.seat);
                this.clearBet(seatIndex);
            });
        });

        // Game controls
        document.getElementById('dealBtn').addEventListener('click', () => this.deal());
        document.getElementById('hitBtn').addEventListener('click', () => this.playerHit());
        document.getElementById('standBtn').addEventListener('click', () => this.playerStand());
        document.getElementById('doubleBtn').addEventListener('click', () => this.playerDouble());
        document.getElementById('splitBtn').addEventListener('click', () => this.playerSplit());
        document.getElementById('refillBtn').addEventListener('click', () => this.refillBalance());

        // Select default chip
        document.querySelector('[data-value="5"]').click();
    }

    addChipToSeat(seatIndex) {
        if (this.game.gameState !== 'betting') {
            alert('Betting phase is over!');
            return;
        }

        if (this.balance < this.selectedChip) {
            alert('Insufficient balance!');
            return;
        }

        if (this.game.placeBet(seatIndex, this.selectedChip)) {
            this.balance -= this.selectedChip;
            this.updateBalanceDisplay();
            this.updateSeatDisplay(seatIndex);
            this.updateURL();
            this.animateChip(seatIndex);
        }
    }

    clearBet(seatIndex) {
        if (this.game.gameState !== 'betting') {
            alert('Cannot clear bet during play!');
            return;
        }

        const bet = this.game.getBet(seatIndex);
        this.balance += bet;
        this.game.clearBet(seatIndex);
        this.updateBalanceDisplay();
        this.updateSeatDisplay(seatIndex);
        this.updateURL();
    }

    deal() {
        // Check if at least one seat has a bet
        const hasAnyBet = this.game.bets.some(bet => bet > 0);
        if (!hasAnyBet) {
            alert('Place at least one bet!');
            return;
        }

        this.game.deal();
        this.updateUI();
        this.updateActionButtons();
    }

    playerHit() {
        this.game.hit();
        this.updateUI();
        this.updateActionButtons();
    }

    playerStand() {
        this.game.stand();
        this.updateUI();
        this.updateActionButtons();

        if (this.game.gameState === 'results') {
            setTimeout(() => this.showResults(), 500);
        }
    }

    playerDouble() {
        const hand = this.game.getCurrentHand();
        if (this.balance < this.game.bets[this.game.currentSeat]) {
            alert('Insufficient balance to double!');
            return;
        }

        this.balance -= this.game.bets[this.game.currentSeat];
        this.game.doubleDown();
        this.updateBalanceDisplay();
        this.updateUI();
        this.updateActionButtons();

        if (this.game.gameState === 'results') {
            setTimeout(() => this.showResults(), 500);
        }
    }

    playerSplit() {
        const splitBet = this.game.bets[this.game.currentSeat] / 2;
        if (this.balance < splitBet) {
            alert('Insufficient balance to split!');
            return;
        }

        this.balance -= splitBet;
        this.game.split();
        this.updateBalanceDisplay();
        this.updateUI();
        this.updateActionButtons();
    }

    refillBalance() {
        this.balance = 1000;
        this.saveBalance();
        this.updateBalanceDisplay();
    }

    updateUI() {
        // Update dealer
        this.updateDealerDisplay();

        // Update player seats
        for (let i = 0; i < 5; i++) {
            this.updateSeatDisplay(i);
        }

        this.updateActionButtons();
    }

    updateDealerDisplay() {
        const dealerCards = document.getElementById('dealerCards');
        const dealerValue = document.getElementById('dealerValue');
        dealerCards.innerHTML = '';

        this.game.dealer.getCards().forEach((card, index) => {
            const cardEl = this.createCardElement(card, index > 0 && this.game.gameState === 'playing');
            dealerCards.appendChild(cardEl);
        });

        if (this.game.gameState === 'dealerTurn' || this.game.gameState === 'results') {
            dealerValue.textContent = `Value: ${this.game.dealer.getValue()}`;
        } else {
            dealerValue.textContent = '';
        }
    }

    updateSeatDisplay(seatIndex) {
        const seat = document.querySelector(`[data-seat="${seatIndex}"]`);
        const playerCards = document.getElementById(`playerCards${seatIndex}`);
        const playerValue = document.getElementById(`playerValue${seatIndex}`);
        const playerStatus = document.getElementById(`playerStatus${seatIndex}`);
        const chipStack = document.getElementById(`chipStack${seatIndex}`);
        const hand = this.game.seats[seatIndex][this.game.currentHandIndex === seatIndex ? this.game.currentHandIndex : 0];
        const bet = this.game.getBet(seatIndex);

        // Clear seat classes
        seat.classList.remove('active', 'busted', 'won', 'lost', 'push');

        if (bet === 0) {
            playerCards.innerHTML = '';
            playerValue.textContent = '0';
            playerStatus.textContent = '';
            chipStack.textContent = '$0';
            return;
        }

        seat.classList.add('active');

        // Update chip stack
        chipStack.textContent = `$${bet}`;

        // Update cards
        playerCards.innerHTML = '';
        this.game.seats[seatIndex].forEach(hand => {
            hand.getCards().forEach(card => {
                const cardEl = this.createCardElement(card);
                playerCards.appendChild(cardEl);
            });
        });

        // Update value
        const totalValue = this.game.seats[seatIndex].reduce((sum, hand) => sum + hand.getValue(), 0);
        playerValue.textContent = totalValue;

        // Update status
        playerStatus.classList.remove('busted', 'won', 'lost', 'push', 'blackjack');
        playerStatus.textContent = '';

        if (this.game.seats[seatIndex].length > 0) {
            const status = this.game.seats[seatIndex][0].status;
            if (status) {
                if (status === 'blackjack') {
                    playerStatus.textContent = '🎉 BLACKJACK!';
                    playerStatus.classList.add('blackjack');
                    seat.classList.add('won');
                } else if (status === 'bust') {
                    playerStatus.textContent = '💥 BUST';
                    playerStatus.classList.add('busted');
                    seat.classList.add('busted');
                } else if (status === 'win') {
                    playerStatus.textContent = '✓ WIN';
                    playerStatus.classList.add('won');
                    seat.classList.add('won');
                } else if (status === 'loss') {
                    playerStatus.textContent = '✗ LOSS';
                    playerStatus.classList.add('lost');
                    seat.classList.add('lost');
                } else if (status === 'push') {
                    playerStatus.textContent = '= PUSH';
                    playerStatus.classList.add('push');
                    seat.classList.add('push');
                }
            }
        }
    }

    createCardElement(card, faceDown = false) {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';

        if (faceDown) {
            cardEl.classList.add('back');
            cardEl.textContent = '🂠';
        } else {
            const suitClass = card.suit === '♠' || card.suit === '♣' ? 'spade club' : 'heart diamond';
            cardEl.classList.add(card.suit === '♥' ? 'heart' : card.suit === '♦' ? 'diamond' : card.suit === '♠' ? 'spade' : 'club');
            cardEl.innerHTML = `<span class="card-rank">${card.rank}</span><span class="card-suit">${card.suit}</span>`;
        }

        return cardEl;
    }

    updateActionButtons() {
        const hand = this.game.getCurrentHand();
        const state = this.game.gameState;

        document.getElementById('dealBtn').disabled = state !== 'betting';
        document.getElementById('hitBtn').disabled = !hand || !hand.canHit();
        document.getElementById('standBtn').disabled = !hand || hand.status !== null;
        document.getElementById('doubleBtn').disabled = !hand || !hand.canDouble();
        document.getElementById('splitBtn').disabled = !hand || !hand.canSplit();
    }

    showResults() {
        // Calculate winnings
        let totalWinnings = 0;
        for (let seat = 0; seat < 5; seat++) {
            const winnings = this.game.calculateWinnings(seat);
            totalWinnings += winnings;
        }

        this.balance += totalWinnings;
        this.updateBalanceDisplay();
        this.saveBalance();

        // After showing results, offer option to play again
        setTimeout(() => {
            const playAgain = confirm('Round over! Play again?');
            if (playAgain) {
                this.game.reset();
                this.updateUI();
                this.updateActionButtons();
            }
        }, 1000);
    }

    animateChip(seatIndex) {
        const chipStack = document.getElementById(`chipStack${seatIndex}`);
        chipStack.classList.add('adding');
        setTimeout(() => chipStack.classList.remove('adding'), 300);
    }

    updateBalanceDisplay() {
        document.getElementById('balance').textContent = `$${this.balance.toLocaleString()}`;
        this.saveBalance();
    }

    updateURL() {
        const activeSeats = [];
        for (let i = 0; i < 5; i++) {
            if (this.game.getBet(i) > 0) {
                activeSeats.push(i + 1);
            }
        }

        if (activeSeats.length > 0) {
            const url = new URL(window.location);
            url.searchParams.set('seats', activeSeats.join(','));
            window.history.replaceState({}, '', url);
        }
    }

    saveBalance() {
        localStorage.setItem('blackjackBalance', this.balance);
    }

    loadBalance() {
        const saved = localStorage.getItem('blackjackBalance');
        return saved ? parseInt(saved) : 1000;
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new GameUI();
});