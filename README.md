# Zero Wallet

### ZeroAlpha Reputation Program

Zero Wallet is a **non-custodial wallet** implementing a **reputation-weighted points and reward system** called **ZeroAlpha**, powered by **FairScale**.

FairScore is a **core backend signal** used to determine **eligibility, weighting, and limits** for on-chain interactions.

---

## Problem

On-chain incentive systems are vulnerable to:

* Sybil attacks
* Wallet farming
* Low-signal participation
* Inefficient reward distribution

Time-based and wallet-count-based mechanisms fail to measure credibility.

---

## Solution

Zero Wallet integrates **FairScale FairScore** directly into backend logic to:

* Evaluate wallet reputation
* Gate participation in ZeroAlpha programs
* Weight allocations by credibility
* Reduce abuse without identity or custody

Reputation becomes an **enforceable system input**, not a cosmetic badge.

---

## FairScore Integration

FairScore is fetched **server-side** using FairScale’s API and normalized to support multiple response formats.

### API Endpoint

```text
GET https://api2.fairscale.xyz/fairScore?wallet=<WALLET_ADDRESS>
```

**Headers**

```text
accept: application/json
fairkey: FAIRSCALE_API_KEY
```

---

## Backend Implementation

The backend service retrieves, normalizes, and maps FairScore values into deterministic tiers and multipliers.

```ts
import fetch from 'node-fetch';

const FAIRSCALE_API_URL = 'https://api2.fairscale.xyz/fairScore';

export const FairscaleService = {
    async getFairScore(walletAddress) {
        const API_KEY = process.env.FAIRSCALE_API_KEY;

        const response = await fetch(
            `${FAIRSCALE_API_URL}?wallet=${walletAddress}`,
            {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    fairkey: API_KEY
                }
            }
        );

        if (!response.ok) {
            return { score: 0, tier: 'RP1', multiplier: 1 };
        }

        const data = await response.json();

        let score = 0;
        if (typeof data === 'number') score = data;
        else if (data?.score) score = data.score;
        else if (data?.fairScore) score = data.fairScore;
        else if (data?.fair_score) score = data.fair_score;

        const { tier, multiplier } = this.calculateMultiplier(score);
        return { score, tier, multiplier };
    },

    calculateMultiplier(score) {
        if (score >= 800) return { tier: 'RP5', multiplier: 3 };
        if (score >= 600) return { tier: 'RP4', multiplier: 2.5 };
        if (score >= 400) return { tier: 'RP3', multiplier: 2 };
        if (score >= 200) return { tier: 'RP2', multiplier: 1.5 };
        return { tier: 'RP1', multiplier: 1 };
    }
};
```

---

## Reputation Tier Model

| Tier | FairScore Range | Multiplier |
| ---- | --------------- | ---------- |
| RP1  | 0–199           | 1.0×       |
| RP2  | 200–399         | 1.5×       |
| RP3  | 400–599         | 2.0×       |
| RP4  | 600–799         | 2.5×       |
| RP5  | 800+            | 3.0×       |

These tiers are used throughout ZeroAlpha logic to **weight participation and outcomes**.

---

## On-Chain Usage

FairScore influences:

* Claim weighting
* Allocation limits
* Program eligibility thresholds
* Future access control logic

All logic is enforced **off-chain in the backend**, while outcomes are executed **on-chain**.

---

## Reliability & Fallbacks

* Server-side FairScore evaluation
* No private key handling
* No custody of user funds
* Deterministic fallback to RP1 on API failure

If FairScale is unavailable, the system safely defaults to **minimum reputation**.

---

## Business Value

ZeroAlpha enables:

* Sybil-resistant incentive programs
* Reputation-weighted distributions
* Lower cost of abuse prevention
* Privacy-preserving credibility scoring

This infrastructure can be reused for:

* Partner campaigns
* DAO incentives
* Token launches
* Gated protocol interactions

---

## Traction & Public Links

* **Legends.fun:**
  [https://www.legends.fun/products/ad9f170b-94f9-4af2-ab02-8e831e0bd2f4](https://www.legends.fun/products/ad9f170b-94f9-4af2-ab02-8e831e0bd2f4)
  *(FAIRathon code: `FAIRAT`)*

* **X / Twitter:**
  [https://x.com/Chainproof_enc](https://x.com/Chainproof_enc)

---

## Why FairScale

FairScale provides:

* Portable on-chain reputation
* Privacy-first scoring
* Credibility without identity

Zero Wallet demonstrates FairScale as **production infrastructure**, not decoration.

---

## Summary

Zero Wallet integrates FairScore as a **first-class system signal**.

Reputation affects outcomes.
Credibility shapes allocation.
ZeroAlpha enforces it.

---

