from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
W,H=A4  # 210 x 297 mm
QW,QH=W/2,H/2  # 105 x 148.5 mm each
c=canvas.Canvas("DepEd_OMR_Answer_Sheet_4up_A4.pdf",pagesize=A4)
c.setTitle("DepEd OMR Answer Sheet - 4 per A4 portrait (50 items)")
def bub(x,y,lbl,r=1.7*mm):
    c.setFillColorRGB(1,1,1);c.setStrokeColorRGB(0,0,0);c.setLineWidth(0.6)
    c.circle(x,y,r,fill=1,stroke=1)
    if lbl:
        c.setFillColorRGB(.4,.4,.4);c.setFont("Helvetica",4.3);c.drawCentredString(x,y-1.5,lbl)
def sheet(ox,oy):
    k=lambda v:v  # helpers in mm relative to sheet
    X=lambda v:ox+v*mm; Y=lambda v:oy+v*mm
    # corner markers 5mm, 4mm inset
    c.setFillColorRGB(0,0,0)
    for a,b in [(4,QH/mm-9),(QW/mm-9,QH/mm-9),(4,4),(QW/mm-9,4)]:
        c.rect(X(a),Y(b),5*mm,5*mm,fill=1,stroke=0)
    top=QH/mm
    c.setFont("Helvetica",5.2)
    c.drawCentredString(X(52.5),Y(top-7),"REPUBLIC OF THE PHILIPPINES · DEPARTMENT OF EDUCATION")
    c.drawCentredString(X(52.5),Y(top-9.6),"REGION XI · SCHOOLS DIVISION OF DAVAO CITY")
    c.setFont("Helvetica-Bold",7.2);c.drawCentredString(X(52.5),Y(top-13),"LEON GARCIA SR. NATIONAL HIGH SCHOOL")
    c.setFont("Helvetica-Bold",8.5);c.drawCentredString(X(52.5),Y(top-17),"ANSWER SHEET")
    c.setFont("Helvetica",6);c.setLineWidth(0.4)
    def line(l,x1,y,x2):
        c.drawString(X(x1),Y(y),l);w=c.stringWidth(l,"Helvetica",6)/mm
        c.line(X(x1+w+0.8),Y(y-0.5),X(x2),Y(y-0.5))
    line("Name (Last, First):",7,top-22.5,75);line("Score:",77,top-22.5,98)
    line("Grade & Section:",7,top-27,50);line("Subject:",52,top-27,80);line("Date:",82,top-27,98)
    # ID box
    bt=top-30; c.setLineWidth(0.7); c.roundRect(X(6),Y(bt-21),93*mm,21*mm,1.5*mm,stroke=1,fill=0)
    c.setFont("Helvetica-Bold",6);c.drawString(X(8),Y(bt-3.3),"LEARNER ID (shade one per row)")
    c.setFont("Helvetica",5);c.drawString(X(48),Y(bt-3.3),"Boy no. 7 = BOY, Tens 0, Ones 7 = B-07")
    rows=[("TYPE",["BOY","GIRL","KEY"]),("TENS",[str(i) for i in range(6)]),("ONES",[str(i) for i in range(10)])]
    for i,(l,opts) in enumerate(rows):
        yy=bt-7.5-i*5
        c.setFillColorRGB(0,0,0);c.setFont("Helvetica-Bold",5.5);c.drawString(X(8),Y(yy-0.9),l)
        for j,o in enumerate(opts):
            if i==0:
                xx=20+j*15; bub(X(xx),Y(yy),"")
                c.setFillColorRGB(0,0,0);c.setFont("Helvetica-Bold",5.5);c.drawString(X(xx+2.5),Y(yy-0.9),o)
            else: bub(X(20+j*7.6),Y(yy),o)
    c.setFillColorRGB(.3,.3,.3);c.setFont("Helvetica-Oblique",4.6)
    c.drawString(X(66),Y(bt-7.5-0.9),"KEY = teacher's key sheet")
    # directions
    c.setFillColorRGB(0,0,0);c.setFont("Helvetica",5)
    c.drawCentredString(X(52.5),Y(bt-24.5),"Pencil or black pen. Shade the circle FULLY. No check/X marks. One answer per number. Erase cleanly.")
    # items
    it=bt-30; colx=[8,32,56,80]; rh=5.9
    for col in range(4):
        c.setFont("Helvetica-Bold",5)
        for li,L in enumerate("ABCD"): c.drawCentredString(X(colx[col]+5+li*4.2),Y(it+2.6),L)
    for n in range(50):
        col,row=n//13,n%13; x=colx[col]; yy=it-row*rh
        if row%2==0:
            c.setFillColorRGB(.93,.94,.98);c.rect(X(x-2.5),Y(yy-2.3),22.5*mm,4.6*mm,fill=1,stroke=0)
        c.setFillColorRGB(0,0,0);c.setFont("Helvetica-Bold",5.8);c.drawRightString(X(x+2.4),Y(yy-1),str(n+1))
        for li,L in enumerate("ABCD"): bub(X(x+5+li*4.2),Y(yy),L)
    c.setFillColorRGB(.45,.45,.45);c.setFont("Helvetica",4.3)
    c.drawCentredString(X(52.5),Y(5.5),"For fewer than 50 items, leave extra numbers blank.")
for ox,oy in [(0,QH),(QW,QH),(0,0),(QW,0)]: sheet(ox,oy)
# cut lines
c.setDash(3,2);c.setLineWidth(0.4);c.setStrokeColorRGB(.5,.5,.5)
c.line(W/2,0,W/2,H);c.line(0,H/2,W,H/2)
c.setFont("Helvetica",5);c.setFillColorRGB(.5,.5,.5);c.drawString(W/2+1.5,H/2+1.5,"cut")
c.showPage();c.save()
