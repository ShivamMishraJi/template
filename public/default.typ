#set text(9pt,font: "Calibri")

#set page(
  margin: (
    top: 3cm,
    bottom: 1.5cm,
    x: 0.5cm,
  ),
  paper: "a4",
  header: [],
  footer: context []
 )

#table(
  columns: (120pt, 65pt, 70pt, 170pt, 65pt, 1fr),
  stroke: 2pt,

  // First Row
  table.cell(
    stroke: (right: none),
    align: center,
    inset: (top:6pt),
    [#image("logo.png", height: 11%)]
  ),

  table.cell(
    colspan: 3,
    align: center,
    stroke: (left: none, right: none),
    [
      #text(11pt, weight: "bold", [FORCE SECURITY SERVICES])\
      #text(11pt, [Office No 26, Ground Floor, Saidham Shopping Plaza,])\
      #text(11pt, [Behind St mary's School, P.k Road, Mulund (W)])\
      #text(11pt, [Mumbai - 400080])\
      #text(11pt, weight: "bold", [Pay Slip For {{pay_slip_month}}])\
      #text(11pt, weight: "bold", [{{employee_name}}])\
      #text(11pt, weight: "bold", [])\
    ]
  ),

  table.cell(
    colspan: 2,
    stroke: (left: none),
    align: center,
    []
  ),

  // Second Box
  // ------------------------------------------------------------------------------- //
  table.cell(
      stroke: (right: none, bottom:none),
      align: left,
      [#text([Employee No. :-])],
    ),

 table.cell(
    colspan: 2,
    align: left,
    stroke: (left: none, bottom:none),
    [#text([{{employee_no}}])]
  ),

 table.cell(
    align: left,
    stroke: (right: none, bottom:none),
    [#text([PAN No :-])]
  ),

 table.cell(
    colspan: 2,
    align: left,
    stroke: (left: none, bottom:none),
    [#text([{{pan_no}}])]
  ),

  // ------------------------------------------------------------------------------- //
  table.cell(
      stroke: (right: none, top:none, bottom:none),
      align: left,
      [#text([Desigation :-])],
    ),

 table.cell(
    colspan: 2,
    align: left,
    stroke: (left: none, top:none, bottom:none),
    [#text([{{designation}}])]
  ),

 table.cell(
    align: left,
    stroke: (right:none, top:none, bottom:none),
    [#text([Adhar No :-])]
  ),

 table.cell(
    colspan: 2,
    align: left,
    stroke: (left:none, top:none, bottom:none),
    [#text([{{aadhaar_no}}])]
  ),

  // ------------------------------------------------------------------------------- //
  table.cell(
      stroke: (right: none, top:none, bottom:none),
      align: left,
      [#text([Location :-])],
    ),

 table.cell(
    colspan: 2,
    align: left,
    stroke: (left: none, top:none, bottom:none),
    [#text([{{location}}])]
  ),

 table.cell(
    align: left,
    stroke: (right:none, top:none, bottom:none),
    [#text([Universal Account Number (UAN) :-])]
  ),

 table.cell(
    colspan: 2,
    align: left,
    stroke: (left:none, top:none, bottom:none),
    [#text([{{uan}}])]
  ),

  // ------------------------------------------------------------------------------- //
  table.cell(
      stroke: (right: none, top:none, bottom:none),
      align: left,
      [#text([Bank Details :-])],
    ),

 table.cell(
    colspan: 2,
    align: left,
    stroke: (left: none, top:none, bottom:none),
    [#text([{{bank_account_number}}])]
  ),

 table.cell(
    align: left,
    stroke: (right:none, top:none, bottom:none),
    [#text([PF Account Number :-])]
  ),

 table.cell(
    colspan: 2,
    align: left,
    stroke: (left:none, top:none, bottom:none),
    [#text([{{pf_account_number}}])]
  ),

  // ------------------------------------------------------------------------------- //
  table.cell(
      stroke: (right: none, top:none, bottom:none),
      align: left,
      [#text([Date of Joining :-])],
    ),

 table.cell(
    colspan: 2,
    align: left,
    stroke: (left: none, top:none, bottom:none),
    [#text([{{date_of_joining}}])]  // dd-mm-yyyy
  ),

 table.cell(
    align: left,
    stroke: (right:none, top:none, bottom:none),
    [#text([ESI Number :-])]
  ),

 table.cell(
    colspan: 2,
    align: left,
    stroke: (left:none, top:none, bottom:none),
    [#text([{{esi_number}}])]
  ),

  // ------------------------------------------------------------------------------- //
  table.cell(
      stroke: (right: none, top:none),
      align: left,
      [#text([Total No Of Days :-])],
    ),

 table.cell(
    colspan: 2,
    align: left,
    stroke: (left: none, top:none),
    [#text([{{total_no_of_days}}])]
  ),

 table.cell(
    align: left,
    stroke: (right:none, top:none),
    [#text([No Of Duties :-])]
  ),

 table.cell(
    colspan: 2,
    align: left,
    stroke: (left:none, top:none),
    [#text([{{no_of_duties}}])]
  ),

  // ------------------------------------------------------------------------------- //

  table.cell(
      stroke: (right: 1pt),
      align: center,
      [#text(weight: "bold", [Earnings])],
    ),

 table.cell(
    align: center,
    stroke: (right:1pt),
    [#text(weight: "bold", [Amount])]
  ),

 table.cell(
    align: center,
    [#text(weight: "bold", [Gross Salary])]
  ),

 table.cell(
    align: center,
    stroke: (right:1pt),
    [#text(weight: "bold", [Deductions])]
  ),

 table.cell(
    align: center,
    stroke: (right:1pt),
    [#text(weight: "bold", [Amount])]
  ),

 table.cell(
    align: center,
    [#text(weight: "bold", [Gross Salary])]
  ),

  // ------------------------------------------------------------------------------- //

  table.cell(
      stroke: (right: 1pt, bottom: 1pt),
      align: left,
      [#text([Basic])],
    ),

 table.cell(
    align: right,
    stroke: (right: 1pt, bottom: 1pt),
    [#text([{{basic}}])]
  ),

 table.cell(
    align: right,
    stroke: (bottom: 1pt),
    [#text([{{basic}}])]
  ),

 table.cell(
    align: left,
    stroke: (right: 1pt, bottom: 1pt),
    [#text("Employee Contribution to PF @ 12%")]
  ),

 table.cell(
    align: right,
    stroke: (right: 1pt, bottom: 1pt),
    [#text([{{pf_employee_contribution}}])]
  ),

 table.cell(
    align: right,
    stroke: (bottom:1pt),
    [#text([{{pf_employee_contribution}}])]
  ),

  // ------------------------------------------------------------------------------- //

  table.cell(
      stroke: (right: 1pt, bottom: 1pt),
      align: left,
      [#text([DA])],
    ),

 table.cell(
    align: right,
    stroke: (right: 1pt, bottom: 1pt),
    [#text([{{da}}])]
  ),

 table.cell(
    align: right,
    stroke: (bottom:1pt),
    [#text([{{da}}])]
  ),

 table.cell(
    align: left,
    stroke: (right: 1pt, bottom:1pt),
    [#text("Employee Contribution to ESIC @ 0.75%")]
  ),

 table.cell(
    align: right,
    stroke: (right: 1pt, bottom:1pt),
    [#text([{{esic_employee_contribution}}])]
  ),

 table.cell(
    align: right,
    stroke: (bottom:1pt),
    [#text([{{esic_employee_contribution}}])]
  ),

  // ------------------------------------------------------------------------------- //

  table.cell(
      stroke: (right: 1pt, bottom: 1pt),
      align: left,
      [#text([House Rent Allowance])],
    ),

 table.cell(
    align: right,
    stroke: (right: 1pt, bottom: 1pt),
    [#text([{{house_rent_allowance}}])]
  ),

 table.cell(
    align: right,
    stroke: (bottom:1pt),
    [#text([{{house_rent_allowance}}])]
  ),

 table.cell(
    align: left,
    stroke: (right: 1pt, bottom:1pt),
    [#text("Professional Tax")]
  ),

 table.cell(
    align: right,
    stroke: (right: 1pt, bottom:1pt),
    [#text([{{professional_tax}}])]
  ),

 table.cell(
    align: right,
    stroke: (bottom:1pt),
    [#text([{{professional_tax}}])]
  ),

  // ------------------------------------------------------------------------------- //

  table.cell(
      stroke: (right: 1pt, bottom: 1pt),
      align: left,
      [#text([Conveyance])],
    ),

 table.cell(
    align: right,
    stroke: (right: 1pt, bottom: 1pt),
    [#text([])]
  ),

 table.cell(
    align: right,
    stroke: (bottom:1pt),
    [#text([{{conveyance}}])]
  ),

 table.cell(
    align: left,
    stroke: (right: 1pt, bottom:1pt),
    [#text("LWF")]
  ),

 table.cell(
    align: right,
    stroke: (right: 1pt, bottom:1pt),
    [#text([])]
  ),

 table.cell(
    align: right,
    stroke: (bottom:1pt),
    [#text([{{lwf}}])]
  ),

  // ------------------------------------------------------------------------------- //

  table.cell(
      stroke: (right: 1pt, bottom: 1pt),
      align: left,
      [#text([Education Allowance])],
    ),

 table.cell(
    align: right,
    stroke: (right: 1pt, bottom: 1pt),
    [#text([])]
  ),

 table.cell(
    align: right,
    stroke: (bottom:1pt),
    [#text([{{education_allowance}}])]
  ),

 table.cell(
    align: left,
    stroke: (right: 1pt, bottom:1pt),
    [#text("Security Deposite")]
  ),

 table.cell(
    align: right,
    stroke: (right: 1pt, bottom:1pt),
    [#text([{{security_deposit}}])]
  ),

 table.cell(
    align: right,
    stroke: (bottom:1pt),
    [#text([{{security_deposit}}])]
  ),

  // ------------------------------------------------------------------------------- //

  table.cell(
      stroke: (right: 1pt, bottom: 1pt),
      align: left,
      [#text([Other Allowance])],
    ),

 table.cell(
    align: right,
    stroke: (right: 1pt, bottom: 1pt),
    [#text([])]
  ),

 table.cell(
    align: right,
    stroke: (bottom:1pt),
    [#text([{{other_allowance}}])]
  ),

 table.cell(
    align: left,
    stroke: (right: 1pt, bottom:1pt),
    [#text([])]
  ),

 table.cell(
    align: right,
    stroke: (right: 1pt, bottom:1pt),
    [#text([])]
  ),

 table.cell(
    align: right,
    stroke: (bottom:1pt),
    [#text([])]
  ),

  // ------------------------------------------------------------------------------- //

  table.cell(
      stroke: (right: 1pt, bottom: 1pt),
      align: left,
      [#text([LTA])],
    ),

 table.cell(
    align: right,
    stroke: (right: 1pt, bottom: 1pt),
    [#text([])]
  ),

 table.cell(
    align: right,
    stroke: (bottom:1pt),
    [#text([{{lta}}])]
  ),

 table.cell(
    align: left,
    stroke: (right: 1pt, bottom:1pt),
    [#text([])]
  ),

 table.cell(
    align: right,
    stroke: (right: 1pt, bottom:1pt),
    [#text([])]
  ),

 table.cell(
    align: right,
    stroke: (bottom:1pt),
    [#text([])]
  ),

  // ------------------------------------------------------------------------------- //

  table.cell(
      stroke: (right: 1pt, bottom: 1pt),
      align: left,
      [#text([Washing Allowance])],
    ),

 table.cell(
    align: right,
    stroke: (right: 1pt, bottom: 1pt),
    [#text([])]
  ),

 table.cell(
    align: right,
    stroke: (bottom:1pt),
    [#text([{{washing_allowance}}])]
  ),

 table.cell(
    align: left,
    stroke: (right: 1pt, bottom:1pt),
    [#text([])]
  ),

 table.cell(
    align: right,
    stroke: (right: 1pt, bottom:1pt),
    [#text([])]
  ),

 table.cell(
    align: right,
    stroke: (bottom:1pt),
    [#text([])]
  ),

  // ------------------------------------------------------------------------------- //

  table.cell(
      stroke: (right: 1pt, bottom: 1pt),
      align: left,
      [#text([Special Allowance])],
    ),

 table.cell(
    align: right,
    stroke: (right: 1pt, bottom: 1pt),
    [#text([])]
  ),

 table.cell(
    align: right,
    stroke: (bottom:1pt),
    [#text([{{special_allowance}}])]
  ),

 table.cell(
    align: left,
    stroke: (right: 1pt, bottom:1pt),
    [#text([])]
  ),

 table.cell(
    align: right,
    stroke: (right: 1pt, bottom:1pt),
    [#text([])]
  ),

 table.cell(
    align: right,
    stroke: (bottom:1pt),
    [#text([])]
  ),

  // ------------------------------------------------------------------------------- //

  table.cell(
      stroke: (right: 1pt, bottom: 1pt),
      align: left,
      [#text([Over Time Earning])],
    ),

 table.cell(
    align: right,
    stroke: (right: 1pt, bottom: 1pt),
    [#text([])]
  ),

 table.cell(
    align: right,
    stroke: (bottom:1pt),
    [#text([{{overtime_earning}}])]
  ),

 table.cell(
    align: left,
    stroke: (right: 1pt, bottom:1pt),
    [#text([])]
  ),

 table.cell(
    align: right,
    stroke: (right: 1pt, bottom:1pt),
    [#text([])]
  ),

 table.cell(
    align: right,
    stroke: (bottom:1pt),
    [#text([])]
  ),

  // ------------------------------------------------------------------------------- //

  table.cell(
      stroke: (right: 1pt, bottom: 1pt),
      align: left,
      [#text([Total Earning])],
    ),

 table.cell(
    align: right,
    stroke: (right: 1pt, bottom: 1pt),
    [#text([{{total_earning}}])]
  ),

 table.cell(
    align: right,
    stroke: (bottom:1pt),
    [#text([{{total_earning}}])]
  ),

 table.cell(
    align: left,
    stroke: (right: 1pt, bottom:1pt),
    [#text(weight: "bold", [Total Deduction])]
  ),

 table.cell(
    align: right,
    stroke: (right: 1pt, bottom:1pt),
    [#text(weight: "bold", [{{total_deduction}}])]
  ),

 table.cell(
    align: right,
    stroke: (bottom:1pt),
    [#text(weight: "bold", [{{total_deduction}}])]
  ),

  // ------------------------------------------------------------------------------- //

  table.cell(
      stroke: (right: 1pt),
      align: left,
      [#text([])],
    ),

 table.cell(
    align: right,
    stroke: (right: 1pt),
    [#text([])]
  ),

 table.cell(
    align: right,
    [#text([])]
  ),

 table.cell(
    colspan: 2,
    align: left,
    stroke: (right: 1pt),
    [#text(weight: "bold", [Net Amount])]
  ),

 table.cell(
    align: right,
    [#text(weight: "bold", [{{net_amount}}])]
  ),

  // ------------------------------------------------------------------------------- //

 table.cell(
    colspan: 6,
    align: left,
    stroke: (bottom:none),
    [#text(weight: "bold", [Amount (in words):])]
  ),

  // ------------------------------------------------------------------------------- //

 table.cell(
    colspan: 6,
    align: left,
    stroke: (top:none, bottom:none),
    [#text(weight: "bold", [{{amount_in_words}}])]
  ),

  // ------------------------------------------------------------------------------- //

 table.cell(
    colspan: 6,
    align: right,
    stroke: (top:none, bottom:none),
    [#text(weight: "bold", [For FORCE SECURITY SERVICES])]
  ),

  // ------------------------------------------------------------------------------- //

 table.cell(colspan: 6,align: right,stroke: (top:none, bottom:none),[#text(weight: "bold", [])]),
 table.cell(colspan: 6,align: right,stroke: (top:none, bottom:none),[#text(weight: "bold", [])]),
 table.cell(colspan: 6,align: right,stroke: (top:none, bottom:none),[#text(weight: "bold", [])]),
 table.cell(colspan: 6,align: right,stroke: (top:none, bottom:none),[#text(weight: "bold", [])]),
 table.cell(colspan: 6,align: right,stroke: (top:none, bottom:none),[#text(weight: "bold", [])]),
 table.cell(colspan: 6,align: right,stroke: (top:none, bottom:none),[#text(weight: "bold", [])]),

  // ------------------------------------------------------------------------------- //
  
 table.cell(
    colspan: 4,
    align: left,
    stroke: (top: none, bottom: none, right: none),
    [#text([This is computer generated signature is not required])]
  ),

  // ------------------------------------------------------------------------------- //
  
 table.cell(
    colspan: 2,
    align: center,
    stroke: (top:none, bottom:none, left: none),
    [#text(weight: "bold", [Authorised Signatory])]
  ),

  // ------------------------------------------------------------------------------- //

 table.cell(colspan: 6,align: right,stroke: (top:none),[#text(weight: "bold", [])]),

  // ------------------------------------------------------------------------------- //
)