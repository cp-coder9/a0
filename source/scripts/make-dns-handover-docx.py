from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

NAVY = RGBColor(0x0C, 0x23, 0x40)
GOLD = RGBColor(0xC8, 0x87, 0x0A)
GREY = RGBColor(0x5A, 0x6B, 0x7C)
INK  = RGBColor(0x1A, 0x1A, 0x1A)

doc = Document()

# page setup
for section in doc.sections:
    section.top_margin = Cm(1.7)
    section.bottom_margin = Cm(1.7)
    section.left_margin = Cm(2.2)
    section.right_margin = Cm(2.2)

# base styles
normal = doc.styles['Normal']
normal.font.name = 'Calibri'
normal.font.size = Pt(10.5)
normal.font.color.rgb = INK
normal.paragraph_format.space_after = Pt(4)

for name, size in [('Heading 1', 15), ('Heading 2', 12.5)]:
    st = doc.styles[name]
    st.font.name = 'Calibri'
    st.font.size = Pt(size)
    st.font.bold = True
    st.font.color.rgb = NAVY
    st.paragraph_format.space_before = Pt(10)
    st.paragraph_format.space_after = Pt(4)

def shade(cell, hexcolor):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hexcolor)
    tcPr.append(shd)

def bottom_border(paragraph, color='C8870A', size='12'):
    pPr = paragraph._p.get_or_add_pPr()
    pbdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), size)
    bottom.set(qn('w:space'), '6')
    bottom.set(qn('w:color'), color)
    pbdr.append(bottom)
    pPr.append(pbdr)

def code_block(lines):
    for line in lines:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.left_indent = Cm(0.5)
        run = p.add_run(line)
        run.font.name = 'Consolas'
        run.font.size = Pt(8.5)
        run.font.color.rgb = RGBColor(0x22, 0x33, 0x44)
        pPr = p._p.get_or_add_pPr()
        shd = OxmlElement('w:shd')
        shd.set(qn('w:val'), 'clear'); shd.set(qn('w:color'), 'auto'); shd.set(qn('w:fill'), 'F2F5F8')
        pPr.append(shd)

def table(headers, rows, widths=None, header_fill='0C2340'):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = 'Table Grid'
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = t.rows[0].cells
    for i, h in enumerate(headers):
        hdr[i].text = ''
        p = hdr[i].paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        shade(hdr[i], header_fill)
    for idx, row in enumerate(rows):
        cells = t.add_row().cells
        for i, value in enumerate(row):
            cells[i].text = ''
            p = cells[i].paragraphs[0]
            r = p.add_run(str(value))
            r.font.size = Pt(9)
            if idx % 2 == 1:
                shade(cells[i], 'F4F7FA')
    for row in t.rows:
        trPr = row._tr.get_or_add_trPr()
        trPr.append(OxmlElement('w:cantSplit'))
    if widths:
        for row in t.rows:
            for i, w in enumerate(widths):
                row.cells[i].width = Cm(w)
    doc.add_paragraph()
    return t

def bullet(text):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_after = Pt(2)
    p.add_run(text)

def step_list(items):
    for i, text in enumerate(items, 1):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.left_indent = Cm(0.75)
        p.paragraph_format.first_line_indent = Cm(-0.75)
        p.add_run(f'{i}.\t' + text)

# ---------- title ----------
title = doc.add_paragraph()
title.paragraph_format.space_after = Pt(2)
r = title.add_run('trukafrik.com — DNS cutover instructions')
r.bold = True
r.font.size = Pt(20)
r.font.color.rgb = NAVY
bottom_border(title)

meta = doc.add_paragraph()
meta.paragraph_format.space_before = Pt(6)
mr = meta.add_run('For: the owner / administrator of the domain trukafrik.com\nPrepared: 2 November 2026')
mr.font.size = Pt(9.5)
mr.font.color.rgb = GREY

doc.add_paragraph()
intro = doc.add_paragraph()
intro.add_run('Goal: ').bold = True
intro.add_run('point trukafrik.com at the new website. The website files are already uploaded to the hosting server (shared IP 169.239.218.61). ')
intro.add_run('Only the DNS changes below are outstanding.').bold = True
intro.add_run(' Nothing else needs to be installed or uploaded.')

# ---------- current situation ----------
doc.add_heading('1. Current situation', level=1)
doc.add_paragraph('These are the values in place today. Only the two website records change; everything else must stay as it is.')
table(
    ['Item', 'Current value'],
    [
        ['Registrar', 'Diamatrix C.C. (domains.co.za)'],
        ['DNS provider (nameservers)', 'ns1.tld-ns.net, ns2.tld-ns.com, ns3.tld-ns.net, ns4.tld-ns.com (Duda / cmslogin.io)'],
        ['Website @ (A record)', '100.24.208.97 and 35.172.94.1 (Duda)'],
        ['Website www', 'CNAME to s.multiscreensite.com (Duda)'],
        ['Mail (MX)', 'mx1.tld-mx.com, priority 10'],
        ['SPF', 'v=spf1 +a +mx include:_spf.tld-mx.com ~all'],
        ['DKIM', 'present on default._domainkey.trukafrik.com'],
        ['mail.trukafrik.com', '169.239.218.61 (already on the new hosting)'],
        ['New website IP', '169.239.218.61'],
    ],
    widths=[5.0, 11.5],
)

# ---------- option 1 ----------
doc.add_heading('2. Option 1 (preferred) — change two website records in the Duda DNS panel', level=1)
doc.add_paragraph('This changes only the website records. Email, SPF, DKIM and every other record stay exactly as they are, so there is no risk to mail.')
step_list([
    'Log in to the Duda account that manages trukafrik.com (the cmslogin.io account).',
    'Open the DNS settings / DNS records for trukafrik.com.',
    'Change only the two website records listed below.',
    'Save the changes. Do not edit MX, TXT (SPF/DKIM), SRV or any other record.',
    'Wait for propagation — normally 10 to 60 minutes (TTL is 600 seconds).',
    'Tell us when it is saved, so we can run the SSL certificate and verify the live site.',
])

doc.add_paragraph()
p1 = doc.add_paragraph()
p1.paragraph_format.space_after = Pt(4)
r1 = p1.add_run('@ (root domain) — A record:  ')
r1.bold = True
p1.add_run('replace both current IPs with 169.239.218.61')
p2 = doc.add_paragraph()
p2.paragraph_format.space_after = Pt(4)
r2 = p2.add_run('www:  ')
r2.bold = True
p2.add_run('delete the CNAME to s.multiscreensite.com; add an A record → 169.239.218.61 (or a CNAME → trukafrik.com)')

# ---------- option 2 ----------
doc.add_heading('3. Option 2 — move DNS to the hosting account, from domains.co.za', level=1)
warn = doc.add_paragraph()
warn.paragraph_format.space_after = Pt(6)
wr = warn.add_run('Use this only if Option 1 is not possible. When the nameservers change, the hosting account becomes responsible for all DNS, including mail, so the mail records above must exist in cPanel before the switch or email delivery will break.')
wr.italic = True
wr.font.color.rgb = RGBColor(0x8A, 0x3B, 0x00)

doc.add_heading('3a. Pre-check (hosting side — we can do this for you)', level=2)
doc.add_paragraph('Before changing nameservers, confirm the hosting DNS zone for trukafrik.com contains:')
for b in [
    'MX: mx1.tld-mx.com, priority 10',
    'TXT: v=spf1 +a +mx include:_spf.tld-mx.com ~all',
    'TXT: the existing DKIM value on default._domainkey',
    'A: mail → 169.239.218.61',
]:
    bullet(b)
doc.add_paragraph('If any are missing, they must be added in cPanel → Zone Editor first. Ask us to run this check before you proceed.')

doc.add_heading('3b. Steps in the domains.co.za client area', level=2)
step_list([
    'Log in at https://www.domains.co.za.',
    'Go to Domains / My Domains.',
    'Click Manage next to trukafrik.com.',
    'Open the Nameservers section (also labelled “Domain Name Servers” or “DNS / Nameservers”).',
    'Select “Use custom nameservers” (not the default or parking option).',
    'Remove ns1.tld-ns.net, ns2.tld-ns.com, ns3.tld-ns.net and ns4.tld-ns.com.',
    'Enter the nameservers supplied by the hosting provider (they are in the hosting welcome email, or ask us).',
    'Save and confirm. Propagation is normally 10 to 60 minutes; allow up to 24 hours.',
    'Inform us when it is saved.',
])

# ---------- next ----------
doc.add_heading('4. What happens next (we handle this)', level=1)
step_list([
    'We run AutoSSL on the hosting account so https://trukafrik.com and https://www.trukafrik.com get a valid certificate.',
    'We verify the live site: home page, range page, all five model pages, the old-URL redirects, and the enquiry form (which emails chris@trukafrik.com).',
    'We confirm the site is live so the old Duda site can be retired.',
])

# ---------- do not ----------
doc.add_heading('5. Please do not change', level=1)
for b in [
    'MX, SPF, DKIM, DMARC or SRV records — changing these will break email.',
    'Nameservers, if you choose Option 1.',
    'Registrant/contact details, transfer lock, or the expiry date (April 2027).',
]:
    bullet(b)

# ---------- rollback ----------
doc.add_heading('6. Rollback', level=1)
doc.add_paragraph('If anything looks wrong after propagation, revert the DNS to the values in section 1 and the old Duda site will serve again. Do not cancel the Duda subscription until we confirm the new site is verified.')

# ---------- verification ----------
doc.add_heading('7. Optional technical verification', level=1)
doc.add_paragraph('For a technical contact, these commands confirm the switch:')
code_block([
    'Resolve-DnsName trukafrik.com -Type A        # expect 169.239.218.61',
    'Resolve-DnsName www.trukafrik.com -Type A    # expect 169.239.218.61',
    'Resolve-DnsName trukafrik.com -Type MX       # expect mx1.tld-mx.com (unchanged)',
])
doc.add_paragraph('Then open https://www.trukafrik.com — the home page should load with a valid padlock once AutoSSL has run.')

# ---------- footer ----------
footer = doc.sections[0].footer
fp = footer.paragraphs[0]
fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
fr = fp.add_run('trukafrik.com — DNS cutover instructions · prepared 2 November 2026 · questions: reply to the sender of this document')
fr.font.size = Pt(8)
fr.font.color.rgb = GREY

doc.save(r'E:\Sitrak-website\docs\domain-dns-handover.docx')
print('saved')
