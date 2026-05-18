/**
 * Deck - Standard casino 6-deck shoe
 */
class Deck {
    constructor() {
        this.cards = [];
        this.discardPile = [];
        this.reshuffle();
    }

    reshuffle() {
        this.cards = [];
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        
        // 6-deck shoe
        for (let deck = 0; deck < 6; deck++) {
            for (let suit of suits) {
                for (let rank of ranks) {
                    this.cards.push({ rank, suit });
                }
            }
        }
        
        this.shuffle();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw() {
        if (this.cards.length < 75) {
            // Reshuffle when penetration reaches 75%
            this.cards = this.discardPile;
            this.discardPile = [];
            this.shuffle();
        }
        return this.cards.pop();
    }

    discard(card) {
        this.discardPile.push(card);
    }
}

/**
 * Hand - Individual player or dealer hand
 */
class Hand {
    constructor() {
        this.cards = [];
        this.bet = 0;
        this.status = null; // null, 'blackjack', 'bust', 'stand', 'win', 'loss', 'push'
    }

    addCard(card) {
        this.cards.push(card);
    }

    getCards() {
        return this.cards;
    }

    getValue() {
        let value = 0;
        let aces = 0;

        for (let card of this.cards) {
            if (card.rank === 'A') {
                aces += 1;
                value += 11;
            } else if (['J', 'Q', 'K'].includes(card.rank)) {
                value += 10;
            } else {
                value += parseInt(card.rank);
            }
        }

        // Adjust for aces if busted
        while (value > 21 && aces > 0) {
            value -= 10;
            aces -= 1;
        }

        return value;
    }

    isBusted() {
        return this.getValue() > 21;
    }

    isBlackjack() {
        return this.cards.length === 2 && this.getValue() === 21;
    }

    isPair() {
        return this.cards.length === 2 && 
               this.cards[0].rank === this.cards[1].rank;
    }

    canSplit() {
        return this.cards.length === 2 && this.isPair() && this.status === null;
    }

    canDouble() {
        return this.cards.length === 2 && this.status === null;
    }

    canHit() {
        return this.getValue() < 21 && this.status === null;
    }

    stand() {
        this.status = 'stand';
    }

    clear() {
        this.cards = [];
        this.status = null;
    }
}

/**
 * Game - Main game logic
 */
class Game {
    constructor() {
        this.deck = new Deck();
        this.dealer = new Hand();
        this.seats = Array(5).fill(null).map(() => [new Hand()]); // Each seat can have multiple hands (splits)
        this.currentSeat = null;
        this.currentHandIndex = null;
        this.gameState = 'betting'; // 'betting', 'playing', 'dealerTurn', 'results'
        this.bets = Array(5).fill(0);
    }

    placeBet(seatIndex, amount) {
        if (this.gameState !== 'betting') {
            return false;
        }
        this.bets[seatIndex] += amount;
        return true;
    }

    clearBet(seatIndex) {
        if (this.gameState !== 'betting') {
            return false;
        }
        this.bets[seatIndex] = 0;
        return true;
    }

    getBet(seatIndex) {
        return this.bets[seatIndex];
    }

    deal() {
        // Reset game
        this.dealer.clear();
        this.seats.forEach(hands => {
            hands.forEach(hand => hand.clear());
            hands.length = 1; // Remove any split hands
        });

        this.gameState = 'playing';

        // Deal initial cards
        for (let seat = 0; seat < 5; seat++) {
            if (this.bets[seat] > 0) {
                const hand = this.seats[seat][0];
                hand.addCard(this.deck.draw());
                hand.addCard(this.deck.draw());

                if (hand.isBlackjack()) {
                    hand.status = 'blackjack';
                }
            }
        }

        // Dealer gets one card face-up, one face-down
        this.dealer.addCard(this.deck.draw()); // Face-up
        this.dealer.addCard(this.deck.draw()); // Face-down

        // Set current seat to first active seat
        this.nextActiveHand();
    }

    nextActiveHand() {
        if (this.gameState !== 'playing') return false;

        // Find next hand that needs action
        for (let seat = 0; seat < 5; seat++) {
            if (this.bets[seat] === 0) continue;

            for (let handIdx = 0; handIdx < this.seats[seat].length; handIdx++) {
                const hand = this.seats[seat][handIdx];
                if (hand.status === null || hand.status === 'double') {
                    this.currentSeat = seat;
                    this.currentHandIndex = handIdx;
                    return true;
                }
            }
        }

        // No more hands to play - dealer's turn
        this.playDealer();
        return false;
    }

    getCurrentHand() {
        if (this.currentSeat === null) return null;
        return this.seats[this.currentSeat][this.currentHandIndex];
    }

    hit() {
        const hand = this.getCurrentHand();
        if (!hand || !hand.canHit()) return false;

        hand.addCard(this.deck.draw());

        if (hand.isBusted()) {
            hand.status = 'bust';
            this.nextActiveHand();
        }

        return true;
    }

    stand() {
        const hand = this.getCurrentHand();
        if (!hand) return false;

        hand.stand();
        this.nextActiveHand();
        return true;
    }

    doubleDown() {
        const hand = this.getCurrentHand();
        if (!hand || !hand.canDouble()) return false;

        this.bets[this.currentSeat] *= 2;
        hand.addCard(this.deck.draw());

        if (hand.isBusted()) {
            hand.status = 'bust';
        } else {
            hand.status = 'double';
        }

        this.nextActiveHand();
        return true;
    }

    split() {
        const hand = this.getCurrentHand();
        if (!hand || !hand.canSplit()) return false;

        // Create new hand with second card
        const newHand = new Hand();
        newHand.addCard(hand.cards.pop());
        newHand.bet = hand.bet;

        // Add card to both hands
        hand.addCard(this.deck.draw());
        newHand.addCard(this.deck.draw());

        // Add new hand to seat
        this.seats[this.currentSeat].push(newHand);

        // Double the bet for split
        this.bets[this.currentSeat] *= 2;

        return true;
    }

    playDealer() {
        this.gameState = 'dealerTurn';
        this.currentSeat = null;
        this.currentHandIndex = null;

        // Reveal hole card
        while (this.dealer.getValue() < 17) {
            this.dealer.addCard(this.deck.draw());
        }

        this.resolveHands();
    }

    resolveHands() {
        this.gameState = 'results';

        const dealerValue = this.dealer.getValue();
        const dealerBusted = this.dealer.isBusted();

        for (let seat = 0; seat < 5; seat++) {
            if (this.bets[seat] === 0) continue;

            for (let hand of this.seats[seat]) {
                if (hand.status === 'blackjack') {
                    // Already marked, will pay 3:2
                    continue;
                }

                if (hand.isBusted()) {
                    hand.status = 'loss';
                } else if (dealerBusted) {
                    hand.status = 'win';
                } else if (hand.getValue() > dealerValue) {
                    hand.status = 'win';
                } else if (hand.getValue() < dealerValue) {
                    hand.status = 'loss';
                } else {
                    hand.status = 'push';
                }
            }
        }
    }

    calculateWinnings(seatIndex) {
        let winnings = 0;
        const hands = this.seats[seatIndex];
        const seatBet = this.bets[seatIndex];

        if (seatBet === 0) return 0;

        // For blackjack, bet was placed once
        if (hands.length === 1 && hands[0].status === 'blackjack') {
            winnings = seatBet * 1.5; // 3:2 payout
        } else {
            // For regular hands and splits, calculate per hand
            const betPerHand = seatBet / hands.length;
            for (let hand of hands) {
                if (hand.status === 'win') {
                    winnings += betPerHand * 2;
                } else if (hand.status === 'push') {
                    winnings += betPerHand;
                }
                // Loss adds nothing
            }
        }

        return winnings;
    }

    reset() {
        this.bets = Array(5).fill(0);
        this.gameState = 'betting';
        this.dealer.clear();
        this.seats.forEach(hands => {
            hands.forEach(hand => hand.clear());
            hands.length = 1;
        });
        this.currentSeat = null;
        this.currentHandIndex = null;
    }
}