# symbolic_dynamics.py
# Reproducible SymPy script to compute T, V, M, C, G and check skew-symmetry.

import sympy as sp

q1,q2,q3 = sp.symbols('q1 q2 q3', real=True)
dq1,dq2,dq3 = sp.symbols('dq1 dq2 dq3', real=True)
g = sp.symbols('g', real=True)
q = sp.Matrix([q1,q2,q3])
dq = sp.Matrix([dq1,dq2,dq3])

# Parameters
l1=l2=l3 = 1
m1=m2=m3 = 1
I1=I2=I3 = 1

# Center-of-mass positions
x1 = (l1/2)*sp.cos(q1); y1 = (l1/2)*sp.sin(q1)
x2 = l1*sp.cos(q1) + (l2/2)*sp.cos(q1+q2)
y2 = l1*sp.sin(q1) + (l2/2)*sp.sin(q1+q2)
x3 = l1*sp.cos(q1) + l2*sp.cos(q1+q2) + (l3/2)*sp.cos(q1+q2+q3)
y3 = l1*sp.sin(q1) + l2*sp.sin(q1+q2) + (l3/2)*sp.sin(q1+q2+q3)

# Jacobians
J1 = sp.Matrix([[sp.diff(x1,qi) for qi in (q1,q2,q3)],
                [sp.diff(y1,qi) for qi in (q1,q2,q3)]])
J2 = sp.Matrix([[sp.diff(x2,qi) for qi in (q1,q2,q3)],
                [sp.diff(y2,qi) for qi in (q1,q2,q3)]])
J3 = sp.Matrix([[sp.diff(x3,qi) for qi in (q1,q2,q3)],
                [sp.diff(y3,qi) for qi in (q1,q2,q3)]])

v1 = J1 * dq
v2 = J2 * dq
v3 = J3 * dq

# Angular velocities
omega1 = dq1
omega2 = dq1 + dq2
omega3 = dq1 + dq2 + dq3

# Kinetic energy
T1 = 0.5*m1*(v1.dot(v1)) + 0.5*I1*omega1**2
T2 = 0.5*m2*(v2.dot(v2)) + 0.5*I2*omega2**2
T3 = 0.5*m3*(v3.dot(v3)) + 0.5*I3*omega3**2
T = sp.simplify(T1 + T2 + T3)

# Potential energy
V = m1*g*y1 + m2*g*y2 + m3*g*y3

# Mass matrix M
M = sp.zeros(3,3)
for i in range(3):
    for j in range(3):
        M[i,j] = sp.simplify(sp.diff(sp.diff(T, dq[i]), dq[j]))

# Coriolis/Centrifugal matrix C
C = sp.zeros(3,3)
for i in range(3):
    for j in range(3):
        cij = 0
        for k in range(3):
            cij += 0.5*(sp.diff(M[i,j], [q1,q2,q3][k]) +
                        sp.diff(M[i,k], [q1,q2,q3][j]) -
                        sp.diff(M[k,j], [q1,q2,q3][i])) * dq[k]
        C[i,j] = sp.simplify(cij)

# Gravity vector
G = sp.Matrix([sp.diff(V, qi) for qi in (q1,q2,q3)])

# Skew-symmetry check
Mdot = sp.zeros(3,3)
for k in range(3):
    Mdot += sp.Matrix([[sp.diff(M[i,j], [q1,q2,q3][k]) for j in range(3)] for i in range(3)]) * dq[k]
X = sp.simplify(Mdot - 2*C)
skew_check = sp.simplify(X + X.T)

print("M(q) ="); sp.pprint(sp.simplify(M))
print("\nC(q,dq) ="); sp.pprint(sp.simplify(C))
print("\nG(q) ="); sp.pprint(sp.simplify(G))
print("\nSkew check (should be zero matrix) ="); sp.pprint(sp.simplify(skew_check))

