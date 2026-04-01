type FaqEntry = {
  question: string
  answer: string | string[]
}

type Section = {
  heading: string
  entries: FaqEntry[]
}

const sections: Section[] = [
  {
    heading: 'Upload errors',
    entries: [
      {
        question: '"Please upload a CSV file."',
        answer: [
          'What causes this: You selected a file that is not a CSV — for example, a PDF, Excel spreadsheet, or image.',
          'What to check: The file extension should end in .csv. If you exported from your bank as Excel (.xlsx or .xls), you will need to save it as CSV first.',
          'How to fix it: Log in to your bank\'s website and re-export your transactions. Look for a "Download as CSV" or "Export transactions" option. Avoid PDF or Excel formats.',
        ],
      },
      {
        question: '"This file is empty."',
        answer: [
          'What causes this: The file you uploaded contains no content — it may not have downloaded correctly, or it was saved empty.',
          'What to check: Open the file in a text editor (e.g. Notepad). If it is blank, the download did not complete. Check your downloads folder to make sure the file finished downloading before uploading.',
          'How to fix it: Re-download the file from your bank. If the problem persists, try a different browser or clear your browser\'s cache before downloading again.',
        ],
      },
      {
        question: '"This file does not match the Bankwest format."',
        answer: [
          'What causes this: The column headers in your file do not match what Brian expects for the selected bank. This usually means you selected the wrong bank, uploaded the wrong type of export, or the file was modified after export.',
          'What to check: Confirm you selected the correct bank. Open the file in a text editor and check the first line — it should contain: BSB Number, Account Number, Transaction Date, Narration, Cheque, Debit, Credit, Balance, Transaction Type (in any order). Make sure you are exporting transaction history, not a statement summary.',
          'How to fix it: Log in to Bankwest, navigate to your account transaction history, and re-export as CSV using the correct export option.',
        ],
      },
      {
        question: '"No transactions found in this file."',
        answer: [
          'What causes this: The file has the correct headers but no transaction rows. The export date range may have returned no results.',
          'What to check: Check the date range you selected when exporting. Open the file in a text editor — if it contains only the header row and nothing else, the export returned no data.',
          'How to fix it: Re-export with a wider date range. If you believe transactions should exist for that period, verify they are visible in your bank\'s transaction history before exporting.',
        ],
      },
      {
        question: '"Invalid date format" or "Invalid date"',
        answer: [
          'What causes this: A transaction row contains a date that is not in DD/MM/YYYY format, or the date values are impossible (e.g. month 13). This often happens when a CSV has been opened and re-saved in Excel, which can reformat date columns automatically.',
          'What to check: Open the file in a text editor and find the flagged row. Check the Transaction Date column — it should look like 30/03/2026. Dashes (30-03-2026) or reversed order (2026/03/30) will cause this error.',
          'How to fix it: Correct the date to DD/MM/YYYY format and re-upload. If the file was edited in Excel, re-export directly from Bankwest instead.',
        ],
      },
      {
        question: '"Non-numeric debit" or "Non-numeric credit"',
        answer: [
          'What causes this: The Debit or Credit column in that row contains text or symbols instead of a plain number. Currency symbols ($), commas, or other characters will trigger this.',
          'What to check: Open the file in a text editor and find the flagged row. The amount columns should contain plain numbers only — no dollar signs, commas, or spaces. A blank cell is valid; only non-numeric text causes this error.',
          'How to fix it: Remove any non-numeric characters from the amount field and re-upload. If you did not edit the file, re-export directly from Bankwest.',
        ],
      },
      {
        question: '"Missing balance" or "Non-numeric balance"',
        answer: [
          'What causes this: The Balance column for that row is empty or contains non-numeric text. Unlike Debit and Credit, Balance is required for every transaction.',
          'What to check: Open the file in a text editor and find the flagged row. The Balance column must contain a plain number (e.g. 1253.28).',
          'How to fix it: Re-export from Bankwest. Do not manually fill in a balance value — use only data exported directly from your bank.',
        ],
      },
    ],
  },
  {
    heading: 'Duplicate transactions',
    entries: [
      {
        question: 'How does Brian detect duplicates?',
        answer: [
          'When you upload a file, Brian compares each transaction against your existing history using four fields: date, description, debit amount, and credit amount. If all four match a transaction already in your history, it is flagged as a duplicate.',
          'This means two transactions on the same day, at the same merchant, for the same amount will be treated as potential duplicates — even if they are genuinely two separate purchases.',
        ],
      },
      {
        question: 'What are my options when duplicates are detected?',
        answer: [
          'Skip duplicates: The flagged transactions are excluded from this import. Only new transactions are added to your history. Use this if you are re-uploading a file you have already imported.',
          'Import all: All transactions are imported, including the flagged duplicates. Use this if you are certain the duplicates are real and distinct transactions.',
          'Decide one by one: A prompt appears for each duplicate individually, letting you choose to import or skip it. Use this when you want to review each case before deciding.',
        ],
      },
      {
        question: 'What if two transactions are genuinely identical — same day, same merchant, same amount?',
        answer: [
          'This can happen. For example, buying two coffees at the same cafe on the same day for the same price would produce two transactions with identical fields.',
          'Brian cannot automatically tell these apart. Use the "Decide one by one" option to review each flagged transaction and choose to import it. If you import both, both will be kept in your history.',
        ],
      },
      {
        question: 'What are the consequences of importing duplicates?',
        answer: [
          'Importing duplicates means the same transaction appears more than once in your history. This will affect your spending totals, category breakdowns, and dashboard charts — all of them will be overstated.',
          'If you realise you have imported duplicates, you can review and remove them from the Transactions page.',
        ],
      },
      {
        question: 'I accidentally imported duplicates. What do I do?',
        answer: [
          'Go to the Transactions page and locate the duplicate transactions. You can delete individual transactions from there.',
          'If you are unsure which transactions are duplicates, filter by date and look for identical entries on the same day.',
        ],
      },
      {
        question: 'Why is Brian not detecting duplicates from a previous upload?',
        answer: [
          'Duplicate detection only works against transactions that have been confirmed and saved to your history. If a previous upload was not confirmed, those transactions are not in your history and duplicates will not be detected.',
          'Duplicate detection is also session-based in the current version — your history is stored for the duration of your session. If you clear your browser or reload, previously imported transactions will not be checked against.',
        ],
      },
    ],
  },
  {
    heading: 'Categorisation',
    entries: [
      {
        question: 'How does Brian categorise my transactions?',
        answer: [
          'Brian matches each transaction description against a set of rules. Each rule contains a pattern — a short piece of text — and a category to assign when that pattern is found.',
          'Matching is case-insensitive, so a rule for "netflix" will match "NETFLIX SUBSCRIPTION", "Netflix", and any other capitalisation.',
        ],
      },
      {
        question: 'What does the confidence level mean?',
        answer: [
          'When a transaction is categorised, Brian assigns a confidence level to indicate how strong the match is.',
          'High: The pattern matched a whole word — for example, "flix" matching "Monthly flix charge". Spaces or punctuation on both sides confirm it is a complete word match.',
          'Medium: The pattern matched at the start of a longer word — for example, "Net" matching "Netflix". It starts cleanly but continues into a longer term.',
          'Low: The pattern was found inside a word with no clean boundary on the left — for example, "flix" matching "Netflix". The match is embedded.',
          'Rules you create manually from your own decisions are always assigned High confidence.',
        ],
      },
      {
        question: 'What is a conflict?',
        answer: [
          'A conflict occurs when two or more rules both match the same transaction. Because Brian cannot decide which category is correct, it flags the transaction as conflicting and leaves it uncategorised.',
          'For example, if you have a rule for "flix" and a separate rule for "Netflix", both will match the description "NETFLIX SUBSCRIPTION". That transaction will be marked as a conflict.',
          'To resolve a conflict, review your rules and remove or narrow the one that is causing the overlap.',
        ],
      },
      {
        question: 'Why are some transactions still showing as Uncategorised?',
        answer: [
          'A transaction is left uncategorised when no rule pattern matches its description. This is expected for merchants or transaction types you have not yet created rules for.',
          'You can create new rules from the Rules page. Once added, re-uploading the same file or reviewing your history will apply the new rules.',
        ],
      },
      {
        question: 'Can the same transaction be categorised differently over time?',
        answer: [
          'Yes. Categorisation is applied at upload time based on the rules that exist at that moment. If you add or change rules later, previously imported transactions will not be automatically updated.',
          'To apply updated rules to old transactions, you would need to clear your history and re-import your files.',
        ],
      },
    ],
  },
  {
    heading: 'Supported banks',
    entries: [
      {
        question: 'Which banks does Brian support?',
        answer: 'Brian currently supports Bankwest, Commonwealth Bank, ANZ, and NAB. Select your bank from the dropdown on the upload page before choosing your file.',
      },
      {
        question: 'How do I export a CSV from Commonwealth Bank?',
        answer: [
          'Log in to NetBank and open your account.',
          'Click "Export" or "Download transactions" and select CSV as the format.',
          'CommBank CSV files do not have column headers — Brian handles this automatically.',
        ],
      },
      {
        question: 'How do I export a CSV from ANZ?',
        answer: [
          'Log in to ANZ Internet Banking and open your account.',
          'Select "Export transactions" and choose CSV format.',
          'ANZ CSV files do not have column headers — Brian handles this automatically.',
        ],
      },
      {
        question: 'How do I export a CSV from NAB?',
        answer: [
          'Log in to NAB Internet Banking and navigate to your account transaction history.',
          'Select "Export" and choose CSV format.',
          'NAB exports use dashes in dates (DD-MM-YYYY) — Brian converts these automatically.',
        ],
      },
      {
        question: 'My bank is not listed. Can I still use Brian?',
        answer: 'Not yet. Brian only supports the banks listed in the dropdown. Support for additional banks will be added in future updates.',
      },
    ],
  },
  {
    heading: 'Transaction history',
    entries: [
      {
        question: 'How do I view my transaction history?',
        answer: 'Click Transactions in the navigation bar. All confirmed transactions are shown here, sorted by transaction date with the most recent first.',
      },
      {
        question: 'How do I upload more transactions?',
        answer: 'Click the "+ Upload transactions" button at the top of the History page. This takes you through the standard upload and review flow. Once confirmed, the new transactions are added to your history.',
      },
      {
        question: 'What is the difference between Transaction date and Import date?',
        answer: [
          'Transaction date is the date the transaction occurred on your bank statement.',
          'Import date is the date you uploaded that batch of transactions into Brian. All transactions from the same upload share the same import date.',
          'You can filter by either date in the Search panel on the History page.',
        ],
      },
      {
        question: 'How do the filters work?',
        answer: [
          'The Display section controls what types of transactions are shown — you can filter by transaction type (spending, income, or both) and by category.',
          'The Search section lets you narrow results by description text, transaction date range, import date range, and amount range.',
          'All filters apply together. Click Reset filters to clear everything back to the default view.',
        ],
      },
      {
        question: 'How do I delete a transaction?',
        answer: [
          'Click the × icon on the right side of any transaction row. A confirmation prompt will appear before anything is deleted.',
          'Deletion is permanent — the transaction is removed from your history and cannot be recovered.',
        ],
      },
      {
        question: 'Why does a transaction not have an Import date?',
        answer: 'Import date is only available for transactions uploaded after this feature was introduced. Older transactions imported before the update will show — in the Imported column.',
      },
      {
        question: 'How do I edit the category of a transaction?',
        answer: [
          'Click the pencil icon (✎) on any transaction row. The Category and Subcategory columns become dropdowns.',
          'Select the new values and click Save. A prompt will appear asking whether you want to save this as a permanent rule for future uploads.',
        ],
      },
      {
        question: 'How do I delete multiple transactions at once?',
        answer: [
          'Use the checkboxes on the left side of each row to select transactions. The header checkbox selects or deselects all filtered transactions.',
          'Once one or more rows are selected, a bulk action bar appears at the top. Click "Delete X" to delete all selected transactions.',
          'A confirmation prompt will appear before anything is deleted.',
        ],
      },
      {
        question: 'How do I bulk re-categorise transactions?',
        answer: [
          'Select the transactions you want to update using the checkboxes.',
          'In the bulk action bar, choose a Category and optionally a Subcategory, then click "Apply to X".',
          'All selected transactions will be updated immediately.',
        ],
      },
    ],
  },
  {
    heading: 'Exporting transactions',
    entries: [
      {
        question: 'How do I export my transactions?',
        answer: [
          'Go to the Transactions page. If you have any transactions loaded, an Export CSV button will appear in the top-right corner next to the upload button.',
          'Clicking it will immediately download a CSV file of your currently filtered transactions.',
        ],
      },
      {
        question: 'Does the export include all transactions or just what is visible on screen?',
        answer: 'The export includes all transactions matching your current filters — not just the current page. If you have 300 transactions and are viewing page 1, all 300 will be exported.',
      },
      {
        question: 'How do I export only a specific date range or category?',
        answer: 'Use the filters on the Transactions page to narrow your view first — by date range, category, transaction type, or any other filter — then click Export CSV. The export will contain only the filtered results.',
      },
      {
        question: 'What columns are included in the export?',
        answer: 'The exported file includes: Transaction Date, Imported, Description, Debit, Credit, Category, Subcategory.',
      },
      {
        question: 'What is the filename of the exported file?',
        answer: [
          'If a transaction date range filter is active, the filename will include the from and to dates — for example, brian-transactions-2025-01-01_2025-03-31.csv.',
          "If no date range is set, the filename uses today's date — for example, brian-transactions-2026-03-31.csv.",
        ],
      },
    ],
  },
  {
    heading: 'Dashboard',
    entries: [
      {
        question: 'What does the dashboard show?',
        answer: [
          'The dashboard gives you a summary of your spending and income for a selected period. It includes total spent, total income, net balance, spending by category, spending or income over time, and your top merchants by spend.',
        ],
      },
      {
        question: 'How do I change the date range?',
        answer: [
          'Use the Period selector in the top-right of the dashboard. Options include This month, Last month, Last 3 months, All time, and Custom.',
          'Selecting Custom shows two date pickers — enter a From and To date to filter to any specific range.',
        ],
      },
      {
        question: 'What does the Group by selector do?',
        answer: [
          'Group by controls how the "Spending over time" and "Income over time" tables are grouped. Options are Day, Week, Month, Quarter, and Year.',
          'For example, selecting Month shows one row per month with the total spending or income for that month.',
        ],
      },
      {
        question: 'What is the Net figure?',
        answer: [
          'Net is total income minus total spending for the selected period. A positive net is shown in green with a + prefix. A negative net is shown in red.',
        ],
      },
      {
        question: 'What are the Spending by category cards?',
        answer: [
          'Each card shows a category, the total amount spent in that category, and a progress bar indicating what percentage of your total spending it represents.',
          'Categories are sorted from highest to lowest spend.',
        ],
      },
      {
        question: 'How do I see income over time instead of spending?',
        answer: [
          'In the "over time" panel, click the Income tab. The chart will switch to show income totals grouped by the selected period.',
          'Click All to see spending and income side by side as a grouped bar chart.',
          'Click Spending to return to the spending view.',
        ],
      },
      {
        question: 'What is the Top merchants table?',
        answer: [
          'Top merchants shows the 10 narrations (transaction descriptions) with the highest total spending in the selected period. Each merchant is ranked by total amount spent.',
          'This is based on the exact description from your bank statement — similar merchants with slightly different descriptions will appear as separate entries.',
        ],
      },
    ],
  },
  {
    heading: 'Account and sign-in',
    entries: [
      {
        question: 'How do I create an account?',
        answer: [
          'Click "Get started" on the home page and enter your email address and a password. You can also sign up using your Google account.',
          'Password requirements: at least 8 characters, including at least one uppercase letter, one lowercase letter, and one symbol.',
        ],
      },
      {
        question: 'Can I sign in with Google?',
        answer: [
          'Yes. Click "Continue with Google" on the sign-in or sign-up page. You will be redirected to Google to authorise access, then returned to Brian.',
          'You may see the Supabase domain shown on the Google authorisation screen — this is expected for the current version. It does not affect how your account or data works.',
        ],
      },
      {
        question: 'Is my data shared between accounts?',
        answer: [
          'No. Each account only has access to its own transactions and rules. Signing in with Google and signing in with email create separate accounts — even if the same email address is used.',
        ],
      },
      {
        question: 'How do I sign out?',
        answer: 'Click the Sign out link in the top-right corner of the navigation bar.',
      },
      {
        question: 'What happens to my data if I sign out?',
        answer: [
          'Your transactions and rules are saved to your account and will be available the next time you sign in.',
          'Nothing is deleted when you sign out.',
        ],
      },
      {
        question: 'I forgot my password. How do I reset it?',
        answer: 'Password reset is not available in the current version. If you are locked out, use the "Continue with Google" option if your email address is linked to a Google account.',
      },
    ],
  },
  {
    heading: 'Reviewing transactions',
    entries: [
      {
        question: 'What is the review screen?',
        answer: [
          'After uploading a file, Brian shows you every transaction from that upload before anything is saved. This is your chance to check, correct, and confirm categories before they are committed to your history.',
          'Nothing is saved until you click Confirm import.',
        ],
      },
      {
        question: 'What do the coloured indicators mean?',
        answer: [
          'Each row has a coloured bar on the left side indicating how confident Brian is in its categorisation.',
          'Green: High confidence — the pattern matched a whole word.',
          'Amber: Medium confidence — the pattern matched the start of a longer word.',
          'Red: Low confidence — the pattern was found embedded inside a word.',
          'Red (Conflict): Two or more rules matched the same transaction — Brian could not decide which to apply.',
          'Grey: Uncategorised — no rule matched this transaction.',
        ],
      },
      {
        question: 'How do I change a category?',
        answer: [
          'Use the Category dropdown on any row to select a different category. The Subcategory dropdown will update automatically to show the options available for that category.',
          'You can assign a parent category without selecting a subcategory — that is valid.',
        ],
      },
      {
        question: 'What is "Accept all High"?',
        answer: [
          'Clicking Accept all High marks every High confidence row as reviewed in one action. Those rows dim slightly to indicate they are accepted.',
          'This lets you quickly clear rows you are confident in and focus your attention on lower confidence rows, conflicts, and uncategorised transactions.',
        ],
      },
      {
        question: 'What happens when I confirm a category change?',
        answer: [
          'When you click Confirm import, Brian checks whether any transactions were changed from Uncategorised to a category. For each one, it asks whether you want to save that mapping as a permanent rule.',
          'If you choose Yes — a rule is saved. Future uploads with matching descriptions will be categorised automatically.',
          'If you choose This upload only — the category is applied to this batch only. No rule is created and future uploads will not be affected.',
        ],
      },
      {
        question: 'What if I still have uncategorised transactions when I confirm?',
        answer: [
          'Brian will warn you before saving if any transactions are still uncategorised — even if they are hidden by a filter.',
          'You can choose to proceed anyway or go back and review them. If you proceed, they will be saved as Uncategorised.',
          'You can suppress this warning permanently using the "Don\'t show me this message again" option in the prompt.',
        ],
      },
      {
        question: 'Can I cancel the review and start over?',
        answer: [
          'Yes. Click Cancel at any point during the review. Your uploaded file will be discarded and nothing will be saved to your history.',
          'You will be returned to the upload screen where you can upload a different file or try again.',
        ],
      },
    ],
  },
]

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-16">
      <div className="w-full max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Help Centre</h1>
        <p className="text-sm text-zinc-500 mb-10">
          Common questions and how to resolve them.
        </p>

        <div className="space-y-12">
          {sections.map((section, si) => (
            <div key={si}>
              <h2 className="text-base font-semibold text-zinc-900 mb-4 pb-2 border-b border-zinc-200">
                {section.heading}
              </h2>
              <div className="space-y-4">
                {section.entries.map((entry, ei) => (
                  <details key={ei} className="bg-white rounded-xl border border-zinc-200 group">
                    <summary className="px-5 py-4 text-sm font-medium text-zinc-800 cursor-pointer select-none list-none flex items-center justify-between gap-3">
                      {entry.question}
                      <span className="text-zinc-400 shrink-0 group-open:rotate-180 transition-transform">▾</span>
                    </summary>
                    <div className="px-5 pb-5 space-y-3 border-t border-zinc-100 pt-4">
                      {Array.isArray(entry.answer)
                        ? entry.answer.map((para, pi) => (
                            <p key={pi} className="text-sm text-zinc-700">{para}</p>
                          ))
                        : <p className="text-sm text-zinc-700">{entry.answer}</p>
                      }
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
