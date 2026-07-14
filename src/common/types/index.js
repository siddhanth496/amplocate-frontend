/**
 * Shared JSDoc typedefs for the Joulit API. JS-only project, so these are
 * documentation/typing hints — no runtime cost.
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} phone_number
 * @property {string} [name]
 * @property {string} [email]
 * @property {string} [profile_picture_url]
 * @property {boolean} is_host
 * @property {number} [trust_score]
 * @property {number} [report_count]
 * @property {boolean} [onboarding_complete]
 */

/**
 * @typedef {Object} Vehicle
 * @property {string} id
 * @property {string} make_id
 * @property {string} model_id
 * @property {string} [make]
 * @property {string} [model]
 * @property {number} [year]
 * @property {string} [connector_type]
 * @property {number} [battery_capacity_kwh]
 * @property {number} [range_km]
 * @property {number} [battery_pct]
 * @property {number} [estimated_range_km]
 * @property {boolean} [is_default]
 * @property {string} [plate]
 */

/**
 * @typedef {Object} ModelSpec
 * @property {string} id
 * @property {string} name
 * @property {[number, number]} [year_range]
 * @property {number} [battery_kwh]
 * @property {number} [range_km]
 * @property {string} [connector_type]
 * @property {string} [ac_connector]
 */

/**
 * @typedef {Object} Charger
 * @property {string} id
 * @property {string} name
 * @property {string} [operator]
 * @property {number} [reliability_score]
 * @property {number} [distance_m]
 * @property {string} [eta]
 * @property {number} [price_per_kwh]
 * @property {string} [speed]
 * @property {string} [ports_available]
 * @property {number} [latitude]
 * @property {number} [longitude]
 * @property {string[]} [amenities]
 * @property {string} [last_verified_at]
 * @property {number} [verified_count]
 */

/**
 * @typedef {Object} Report
 * @property {string} id
 * @property {string} charger_id
 * @property {string} status
 * @property {string} [issue_type]
 * @property {string} [notes]
 * @property {string} [created_at]
 * @property {string} [user_name]
 */

/**
 * @typedef {'worked' | 'partial' | 'broken' | 'queue' | 'ice'} ReportIssueType
 */

/**
 * @typedef {Object} ReportCreate
 * @property {string} status
 * @property {ReportIssueType} [issue_type]
 * @property {string} [notes]
 */

/**
 * @typedef {Object} TripWaypoint
 * @property {string} charger_id
 * @property {string} [name]
 * @property {number} latitude
 * @property {number} longitude
 * @property {number} [arrival_battery_pct]
 * @property {number} [departure_battery_pct]
 * @property {number} [dwell_min]
 * @property {number} [price_per_kwh]
 * @property {number} [reliability_score]
 */

/**
 * @typedef {Object} TripPlan
 * @property {TripWaypoint[]} waypoints
 * @property {number} [total_distance_km]
 * @property {number} [total_duration_min]
 * @property {number} [total_cost_inr]
 */

/**
 * @typedef {Object} Session
 * @property {string} id
 * @property {string} charger_id
 * @property {string} vehicle_id
 * @property {'ACTIVE' | 'COMPLETED' | 'PAYMENT_PENDING'} status
 * @property {number} [soc_start_pct]
 * @property {number} [soc_end_pct]
 * @property {number} [kwh_delivered]
 * @property {number} [amount_inr]
 * @property {string} [started_at]
 * @property {string} [ended_at]
 */

/**
 * @typedef {Object} MonthlySpend
 * @property {string} month
 * @property {number} amount
 */

/**
 * @typedef {Object} SessionInsights
 * @property {string} period
 * @property {number} saved_vs_petrol_inr
 * @property {number} [emi_months_equivalent]
 * @property {number} kwh_charged
 * @property {number} total_sessions
 * @property {number} avg_cost_per_kwh
 * @property {MonthlySpend[]} monthly_spend
 */

/**
 * @typedef {Object} P2PListing
 * @property {string} id
 * @property {string} host_id
 * @property {string} [title]
 * @property {string} [city]
 * @property {string} [connector_type]
 * @property {number} [price_per_kwh]
 * @property {boolean} [active]
 */

/**
 * @typedef {Object} EarningsEstimate
 * @property {number} estimated_monthly_inr
 * @property {number} sessions_per_week
 * @property {number} availability_hrs_per_week
 * @property {number} price_per_kwh
 * @property {number} voltara_commission_pct
 * @property {number} avg_session_kwh
 * @property {string} payout_method
 */

export {};
