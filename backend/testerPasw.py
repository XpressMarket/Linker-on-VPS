from passlib.hash import bcrypt

b = bcrypt.hash("Tester1234")

print(b)