# Forecast methodology

## Eligibility

A forecast is generated only when a single exact series has at least 30 daily observations over at least 21 days. Provider, identity, variant, condition, price type, and currency must match. Probable/model-only identity, invalid prices, short history, or mixed series returns `insufficient_data`.

## Deterministic candidates

- naive last value;
- 7-observation moving average;
- exponential smoothing with fixed alpha;
- ordinary least-squares linear trend;
- Holt level/trend with fixed alpha and beta.

No generative AI or heavy ML dependency determines prices.

## Backtest and selection

The final 7–14 observations form rolling-origin validation points. Each point is predicted using only earlier observations. Every model reports:

- MAE;
- sMAPE;
- directional accuracy when the actual direction is non-flat;
- residual dispersion.

Naive is the baseline. A more complex model is eligible only when both MAE and sMAPE are materially lower. Near-ties prefer the simpler model.

## Forecast and interval

The chosen model produces deterministic 7-day and 30-day point estimates. The interval uses backtest error/residual dispersion scaled by the square root of the horizon and is bounded above zero. It is a reference uncertainty band, not a probabilistic guarantee.

Confidence is derived from observation count, history length, missing-day ratio, and sMAPE:

- high requires long, dense history and low error;
- low is used for short eligible history, many gaps, or high error;
- medium covers the remainder.

The UI must state that historical price data does not guarantee actual transaction prices. It must not claim guaranteed movement, a buying moment, investment suitability, or profit.

