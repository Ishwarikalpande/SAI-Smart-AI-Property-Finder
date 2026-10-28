import math
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/loan", tags=["Loan & EMI"])

class LoanEligibilityRequest(BaseModel):
    monthly_income: float = Field(..., gt=0, description="Gross monthly income in INR")
    existing_emi: float = Field(0.0, ge=0, description="Existing ongoing monthly EMIs")
    tenure_years: int = Field(20, ge=1, le=35, description="Loan tenure in years")
    interest_rate: float = Field(8.5, gt=0, le=25, description="Annual interest rate in %")
    property_price: Optional[float] = Field(None, gt=0, description="Optional target property price in INR")

class LoanEligibilityResponse(BaseModel):
    eligible_loan: float
    monthly_emi: float
    down_payment: float
    total_interest: float
    total_repayment: float
    tenure_years: int
    interest_rate: float
    monthly_income: float
    disclaimer: str = "Estimates are calculated using standard banking FOIR (50%) and reducing-balance annuity formulas. Actual loan eligibility is subject to lender verification."

class EMICalculatorRequest(BaseModel):
    loan_amount: float = Field(..., gt=0, description="Loan principal amount in INR")
    interest_rate: float = Field(..., gt=0, le=25, description="Annual interest rate in %")
    tenure_years: int = Field(..., ge=1, le=35, description="Tenure in years")

class EMICalculatorResponse(BaseModel):
    monthly_emi: float
    principal: float
    total_interest: float
    total_payment: float
    tenure_months: int
    interest_rate: float
    disclaimer: str = "Calculated using standard reducing-balance monthly amortization formula."


def calculate_reducing_balance_emi(principal: float, annual_rate: float, months: int) -> float:
    if months <= 0:
        return 0.0
    r = (annual_rate / 100.0) / 12.0
    if r <= 0:
        return principal / months
    emi = principal * r * math.pow(1 + r, months) / (math.pow(1 + r, months) - 1)
    return round(emi, 2)


@router.post("/eligibility", response_model=LoanEligibilityResponse)
def calculate_loan_eligibility(payload: LoanEligibilityRequest):
    """
    Calculates estimated home loan eligibility based on monthly income, FOIR (50%),
    existing debt obligations, tenure, and interest rate.
    """
    n = payload.tenure_years * 12
    r = (payload.interest_rate / 100.0) / 12.0

    # Max permissible EMI by banks (50% FOIR minus existing liabilities)
    max_emi_capacity = (payload.monthly_income * 0.50) - payload.existing_emi
    if max_emi_capacity <= 0:
        return LoanEligibilityResponse(
            eligible_loan=0.0,
            monthly_emi=0.0,
            down_payment=0.0,
            total_interest=0.0,
            total_repayment=0.0,
            tenure_years=payload.tenure_years,
            interest_rate=payload.interest_rate,
            monthly_income=payload.monthly_income,
        )

    # Present Value PV of Annuity for loan amount
    # PV = EMI * [( (1+r)^n - 1 ) / ( r * (1+r)^n )]
    if r > 0:
        compound = math.pow(1 + r, n)
        pv = max_emi_capacity * ((compound - 1) / (r * compound))
    else:
        pv = max_emi_capacity * n

    eligible_loan = round(pv, -3)  # Round to nearest thousand

    # Apply 80% LTV cap if property_price given
    if payload.property_price and payload.property_price > 0:
        ltv_cap = payload.property_price * 0.80
        if eligible_loan > ltv_cap:
            eligible_loan = round(ltv_cap, -3)
        down_payment = round(payload.property_price - eligible_loan, -3)
    else:
        # Standard 20% down payment required on purchase value
        # If eligible loan = 80%, property value = eligible / 0.8 => down payment = 25% of loan
        down_payment = round(eligible_loan * 0.25, -3)

    monthly_emi = calculate_reducing_balance_emi(eligible_loan, payload.interest_rate, n)
    total_repayment = round(monthly_emi * n, 2)
    total_interest = round(total_repayment - eligible_loan, 2)

    return LoanEligibilityResponse(
        eligible_loan=eligible_loan,
        monthly_emi=monthly_emi,
        down_payment=down_payment,
        total_interest=total_interest,
        total_repayment=total_repayment,
        tenure_years=payload.tenure_years,
        interest_rate=payload.interest_rate,
        monthly_income=payload.monthly_income,
    )


@router.post("/emi", response_model=EMICalculatorResponse)
def calculate_emi(payload: EMICalculatorRequest):
    """
    Standard monthly reducing-balance EMI calculator.
    """
    months = payload.tenure_years * 12
    monthly_emi = calculate_reducing_balance_emi(payload.loan_amount, payload.interest_rate, months)
    total_payment = round(monthly_emi * months, 2)
    total_interest = round(total_payment - payload.loan_amount, 2)

    return EMICalculatorResponse(
        monthly_emi=monthly_emi,
        principal=payload.loan_amount,
        total_interest=total_interest,
        total_payment=total_payment,
        tenure_months=months,
        interest_rate=payload.interest_rate,
    )
