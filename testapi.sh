#!/bin/bash

# Hypertube API Security & Stress Testing Suite
# Replace YOUR_ACCESS_TOKEN with your actual token
BASE_URL="http://localhost:3000"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWg3dHp2bmUwMDAwMTQ4aTJxdGYwamZ3IiwiaWF0IjoxNzYxNTAzODAzLCJleHAiOjE3NjE1MDQ3MDN9.5MDSTV8o1HF-qJ-qAQXwjkCtsr2wEi4zBLqyxNQ7A8Y"


# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "HYPERTUBE API SECURITY TEST SUITE"
echo "======================================"
echo ""

# ==========================================
# 1. AUTHENTICATION BYPASS ATTEMPTS
# ==========================================
echo -e "${YELLOW}[1] AUTHENTICATION BYPASS TESTS${NC}"

echo "[1.1] SQL Injection in login"
curl -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"admin@example.com'\'' OR '\''1'\''='\''1","password":"anything"}' \
  -w "\nStatus: %{http_code}\n\n"

echo "[1.2] NoSQL Injection in login"
curl -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":{"$ne":null},"password":{"$ne":null}}' \
  -w "\nStatus: %{http_code}\n\n"

echo "[1.3] JWT Token manipulation - Invalid signature"
curl -X GET "$BASE_URL/api/users/me" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" \
  -w "\nStatus: %{http_code}\n\n"

echo "[1.4] JWT Token - None algorithm attack"
curl -X GET "$BASE_URL/api/users/me" \
  -H "Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VySWQiOiJhZG1pbiJ9." \
  -w "\nStatus: %{http_code}\n\n"

echo "[1.5] Access protected endpoint without token"
curl -X GET "$BASE_URL/api/users/me" \
  -w "\nStatus: %{http_code}\n\n"

echo "[1.6] Expired/Invalid refresh token"
curl -X POST "$BASE_URL/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"expired.token.here"}' \
  -w "\nStatus: %{http_code}\n\n"

# ==========================================
# 2. INJECTION ATTACKS
# ==========================================
echo -e "\n${YELLOW}[2] INJECTION ATTACK TESTS${NC}"

echo "[2.1] XSS in registration - firstname"
curl -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"xss@test.com","username":"xsstest","password":"Test@123456","firstName":"<script>alert(\"XSS\")</script>","lastName":"Test"}' \
  -w "\nStatus: %{http_code}\n\n"

echo "[2.2] XSS in comment content"
curl -X POST "$BASE_URL/api/movies/550/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content":"<img src=x onerror=alert(document.cookie)>"}' \
  -w "\nStatus: %{http_code}\n\n"

echo "[2.3] Command injection in search"
curl -X GET "$BASE_URL/api/movies/search?title=test;ls+-la&page=1" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nStatus: %{http_code}\n\n"

echo "[2.4] Path traversal in movie ID"
curl -X GET "$BASE_URL/api/movies/../../../etc/passwd" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nStatus: %{http_code}\n\n"

echo "[2.5] LDAP Injection in username"
curl -X GET "$BASE_URL/api/users/username/*)(uid=*))(|(uid=*" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nStatus: %{http_code}\n\n"

echo "[2.6] XML Injection in comment"
curl -X POST "$BASE_URL/api/movies/550/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content":"<?xml version=\"1.0\"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM \"file:///etc/passwd\">]><comment>&xxe;</comment>"}' \
  -w "\nStatus: %{http_code}\n\n"

# ==========================================
# 3. AUTHORIZATION & PRIVILEGE ESCALATION
# ==========================================
echo -e "\n${YELLOW}[3] AUTHORIZATION & PRIVILEGE ESCALATION TESTS${NC}"

echo "[3.1] Update another user's profile (IDOR)"
curl -X PUT "$BASE_URL/api/users/different-user-id-123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"firstName":"Hacked","lastName":"User"}' \
  -w "\nStatus: %{http_code}\n\n"

echo "[3.2] Delete another user's comment"
curl -X DELETE "$BASE_URL/api/comments/someone-elses-comment-id" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nStatus: %{http_code}\n\n"

echo "[3.3] Access another user's devices"
curl -X GET "$BASE_URL/api/auth/devices" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nStatus: %{http_code}\n\n"

echo "[3.4] Revoke another user's device"
curl -X DELETE "$BASE_URL/api/auth/devices/another-user-device-id" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nStatus: %{http_code}\n\n"

# ==========================================
# 4. INPUT VALIDATION & BOUNDARY TESTS
# ==========================================
echo -e "\n${YELLOW}[4] INPUT VALIDATION & BOUNDARY TESTS${NC}"

echo "[4.1] Extremely long email (10000 chars)"
LONG_EMAIL=$(printf 'a%.0s' {1..10000})
curl -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${LONG_EMAIL}@test.com\",\"username\":\"test\",\"password\":\"Test@123\",\"firstName\":\"Test\",\"lastName\":\"Test\"}" \
  -w "\nStatus: %{http_code}\n\n"

echo "[4.2] Extremely long comment (100000 chars)"
LONG_COMMENT=$(printf 'a%.0s' {1..100000})
curl -X POST "$BASE_URL/api/movies/550/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"content\":\"${LONG_COMMENT}\"}" \
  -w "\nStatus: %{http_code}\n\n"

echo "[4.3] Negative pagination values"
curl -X GET "$BASE_URL/api/movies/search?page=-1&limit=-50" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nStatus: %{http_code}\n\n"

echo "[4.4] Excessive pagination limit"
curl -X GET "$BASE_URL/api/movies/search?page=1&limit=999999" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nStatus: %{http_code}\n\n"

echo "[4.5] Invalid rating values"
curl -X POST "$BASE_URL/api/movies/550/rate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"rating":99999}' \
  -w "\nStatus: %{http_code}\n\n"

echo "[4.6] Negative rating"
curl -X POST "$BASE_URL/api/movies/550/rate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"rating":-100}' \
  -w "\nStatus: %{http_code}\n\n"

echo "[4.7] Non-numeric rating"
curl -X POST "$BASE_URL/api/movies/550/rate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"rating":"infinity"}' \
  -w "\nStatus: %{http_code}\n\n"

echo "[4.8] Null bytes in input"
curl -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d $'{"email":"test@test.com","username":"test\x00admin","password":"Test@123","firstName":"Test","lastName":"Test"}' \
  -w "\nStatus: %{http_code}\n\n"

echo "[4.9] Unicode control characters"
curl -X POST "$BASE_URL/api/movies/550/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content":"Test\u0000\u0001\u0002\u0003\u0004"}' \
  -w "\nStatus: %{http_code}\n\n"

# ==========================================
# 5. MASS ASSIGNMENT & PARAMETER POLLUTION
# ==========================================
echo -e "\n${YELLOW}[5] MASS ASSIGNMENT & PARAMETER POLLUTION TESTS${NC}"

echo "[5.1] Try to set admin role during registration"
curl -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hack.com","username":"hackadmin","password":"Test@123","firstName":"Admin","lastName":"User","role":"admin","isAdmin":true}' \
  -w "\nStatus: %{http_code}\n\n"

echo "[5.2] Try to modify user ID during profile update"
curl -X PUT "$BASE_URL/api/users/me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id":"new-user-id","firstName":"Test","isVerified":true,"role":"admin"}' \
  -w "\nStatus: %{http_code}\n\n"

echo "[5.3] Parameter pollution in search"
curl -X GET "$BASE_URL/api/movies/search?title=test&title=<script>alert(1)</script>&page=1&page=999" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nStatus: %{http_code}\n\n"

# ==========================================
# 6. RACE CONDITIONS & CONCURRENCY
# ==========================================
echo -e "\n${YELLOW}[6] RACE CONDITION TESTS${NC}"

echo "[6.1] Parallel movie downloads (10 simultaneous)"
for i in {1..10}; do
  curl -X POST "$BASE_URL/api/torrent/downloadMovie" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"movieId":"test-movie-id","quality":"1080p"}' &
done
wait
echo -e "\nAll parallel requests completed\n"

echo "[6.2] Parallel comment creation (race condition)"
for i in {1..20}; do
  curl -X POST "$BASE_URL/api/movies/550/comments" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"content\":\"Race condition test $i\"}" &
done
wait
echo -e "\nAll parallel requests completed\n"

echo "[6.3] Rapid rating changes (same movie)"
for i in {1..50}; do
  curl -X POST "$BASE_URL/api/movies/550/rate" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"rating\":$((RANDOM % 10 + 1))}" &
done
wait
echo -e "\nAll parallel requests completed\n"

# ==========================================
# 7. DENIAL OF SERVICE (DoS)
# ==========================================
# echo -e "\n${YELLOW}[7] DENIAL OF SERVICE TESTS${NC}"

# echo "[7.1] Rapid fire requests (100 requests)"
# for i in {1..100}; do

#   curl -s -X GET "$BASE_URL/api/movies/popular" \
#     -H "Authorization: Bearer $TOKEN" > /dev/null &
# done
# wait
# echo -e "\nCompleted 100 parallel requests\n"

# echo "[7.2] Nested search queries"
# curl -X GET "$BASE_URL/api/movies/search?title=%25%25%25%25%25&genre=%25%25%25%25%25&cast=%25%25%25%25%25&director=%25%25%25%25%25" \
#   -H "Authorization: Bearer $TOKEN" \
#   -w "\nStatus: %{http_code}\n\n"

# echo "[7.3] Regex DoS in search"
# curl -X GET "$BASE_URL/api/movies/search?title=(a%2B)%2B$&page=1" \
#   -H "Authorization: Bearer $TOKEN" \
#   -w "\nStatus: %{http_code}\n\n"

# echo "[7.4] Memory exhaustion via large payload"
# HUGE_PAYLOAD=$(printf '{"items":[' && printf '{"data":"x"},' {1..10000} && printf '{"data":"x"}]}')
# curl -X POST "$BASE_URL/api/movies/550/comments" \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer $TOKEN" \
#   -d "$HUGE_PAYLOAD" \
#   -w "\nStatus: %{http_code}\n\n"

# ==========================================
# 8. FILE UPLOAD ATTACKS
# ==========================================
echo -e "\n${YELLOW}[8] FILE UPLOAD ATTACK TESTS${NC}"

echo "[8.1] Upload PHP shell as profile picture"
echo "<?php system(\$_GET['cmd']); ?>" > /tmp/shell.php
curl -X POST "$BASE_URL/api/users/me/picture" \
  -H "Authorization: Bearer $TOKEN" \
  -F "picture=@/tmp/shell.php" \
  -w "\nStatus: %{http_code}\n\n"
rm /tmp/shell.php

echo "[8.2] Upload extremely large file (simulate)"
dd if=/dev/zero of=/tmp/huge.jpg bs=1M count=100 2>/dev/null
curl -X POST "$BASE_URL/api/users/me/picture" \
  -H "Authorization: Bearer $TOKEN" \
  -F "picture=@/tmp/huge.jpg" \
  -w "\nStatus: %{http_code}\n\n"
rm /tmp/huge.jpg

echo "[8.3] Upload file with double extension"
echo "malicious content" > /tmp/image.jpg.php
curl -X POST "$BASE_URL/api/users/me/picture" \
  -H "Authorization: Bearer $TOKEN" \
  -F "picture=@/tmp/image.jpg.php" \
  -w "\nStatus: %{http_code}\n\n"
rm /tmp/image.jpg.php

echo "[8.4] Upload file with null byte"
echo "test" > /tmp/test.jpg%00.php
curl -X POST "$BASE_URL/api/users/me/picture" \
  -H "Authorization: Bearer $TOKEN" \
  -F "picture=@/tmp/test.jpg%00.php" \
  -w "\nStatus: %{http_code}\n\n"
rm /tmp/test.jpg%00.php

# ==========================================
# 9. BUSINESS LOGIC FLAWS
# ==========================================
echo -e "\n${YELLOW}[9] BUSINESS LOGIC FLAW TESTS${NC}"

echo "[9.1] Add same movie to library multiple times"
for i in {1..10}; do
  curl -X POST "$BASE_URL/api/movies/550/add-to-library" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"watched":true,"favorite":true,"watchlist":true}' &
done
wait
echo -e "\nCompleted\n"

echo "[9.2] Rate movie without watching"
curl -X POST "$BASE_URL/api/movies/999999/rate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"rating":10}' \
  -w "\nStatus: %{http_code}\n\n"

echo "[9.3] Comment on non-existent movie"
curl -X POST "$BASE_URL/api/movies/999999999/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content":"This movie does not exist"}' \
  -w "\nStatus: %{http_code}\n\n"

echo "[9.4] Verify email with reused token"
curl -X GET "$BASE_URL/api/auth/verify-email?token=already-used-token-123" \
  -w "\nStatus: %{http_code}\n\n"

echo "[9.5] Reset password with expired token"
curl -X POST "$BASE_URL/api/auth/reset-password/expired-token-abc" \
  -H "Content-Type: application/json" \
  -d '{"newPassword":"NewPass@123"}' \
  -w "\nStatus: %{http_code}\n\n"

# ==========================================
# 10. INFORMATION DISCLOSURE
# ==========================================
echo -e "\n${YELLOW}[10] INFORMATION DISCLOSURE TESTS${NC}"

echo "[10.1] Try to access sensitive endpoints without auth"
curl -X GET "$BASE_URL/api/users" \
  -w "\nStatus: %{http_code}\n\n"

echo "[10.2] Enumerate users via username"
curl -X GET "$BASE_URL/api/users/username/admin" \
  -w "\nStatus: %{http_code}\n\n"

echo "[10.3] Get other user's devices"
curl -X GET "$BASE_URL/api/auth/devices" \
  -H "Authorization: Bearer invalid-token" \
  -w "\nStatus: %{http_code}\n\n"

echo "[10.4] Check for verbose error messages"
curl -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"nonexistent@user.com","password":"wrongpass"}' \
  -v 2>&1 | grep -i "stack\|trace\|error"

echo "[10.5] Server header disclosure"
curl -I "$BASE_URL/api/auth/health" | grep -i "server\|x-powered"

# ==========================================
# 11. TORRENT-SPECIFIC ATTACKS
# ==========================================
echo -e "\n${YELLOW}[11] TORRENT-SPECIFIC ATTACK TESTS${NC}"

echo "[11.1] Path traversal in stream endpoint"
curl -X GET "$BASE_URL/api/torrent/stream?id=../../etc/passwd&quality=1080p" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nStatus: %{http_code}\n\n"

echo "[11.2] Download movie with invalid TMDB ID"
curl -X POST "$BASE_URL/api/torrent/downloadMovie" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"movieId":"../../../etc/passwd","quality":"1080p"}' \
  -w "\nStatus: %{http_code}\n\n"

echo "[11.3] Subtitle language injection"
curl -X GET "$BASE_URL/api/torrent/check-subtitles?tmdbId=550&language=../../etc/passwd" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nStatus: %{http_code}\n\n"

echo "[11.4] Stream with malicious range headers"
curl -X GET "$BASE_URL/api/torrent/stream?id=test&quality=1080p" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Range: bytes=999999999999999-999999999999999" \
  -w "\nStatus: %{http_code}\n\n"

echo "[11.5] Multiple simultaneous streams (exhaust resources)"
for i in {1..20}; do
  curl -X GET "$BASE_URL/api/torrent/stream?id=movie-$i&quality=4K" \
    -H "Authorization: Bearer $TOKEN" &
done
wait
echo -e "\nCompleted\n"

# ==========================================
# 12. SESSION & TOKEN MANIPULATION
# ==========================================
echo -e "\n${YELLOW}[12] SESSION & TOKEN MANIPULATION TESTS${NC}"

echo "[12.1] Reuse logout token"
LOGOUT_TOKEN="your-token-here"
curl -X POST "$BASE_URL/api/auth/logout" \
  -H "Authorization: Bearer $LOGOUT_TOKEN" \
  -w "\nStatus: %{http_code}\n\n"
# Try to use it again
curl -X GET "$BASE_URL/api/users/me" \
  -H "Authorization: Bearer $LOGOUT_TOKEN" \
  -w "\nStatus: %{http_code}\n\n"

echo "[12.2] Token with modified payload"
curl -X GET "$BASE_URL/api/users/me" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiJ9.fake-signature" \
  -w "\nStatus: %{http_code}\n\n"

echo "[12.3] Refresh token replay attack"
curl -X POST "$BASE_URL/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"'$TOKEN'"}' \
  -w "\nStatus: %{http_code}\n\n"

# ==========================================
# 13. HEADER MANIPULATION
# ==========================================
echo -e "\n${YELLOW}[13] HEADER MANIPULATION TESTS${NC}"

echo "[13.1] Host header injection"
curl -X GET "$BASE_URL/api/auth/health" \
  -H "Host: evil.com" \
  -w "\nStatus: %{http_code}\n\n"

echo "[13.2] X-Forwarded-For spoofing"
curl -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 127.0.0.1" \
  -d '{"emailOrUsername":"test@test.com","password":"test"}' \
  -w "\nStatus: %{http_code}\n\n"

echo "[13.3] Content-Type confusion"
curl -X POST "$BASE_URL/api/movies/550/comments" \
  -H "Content-Type: text/plain" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content":"test"}' \
  -w "\nStatus: %{http_code}\n\n"

echo "[13.4] Multiple Authorization headers"
curl -X GET "$BASE_URL/api/users/me" \
  -H "Authorization: Bearer invalid-token" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nStatus: %{http_code}\n\n"

# ==========================================
# 14. PROTOCOL-LEVEL ATTACKS
# ==========================================
echo -e "\n${YELLOW}[14] PROTOCOL-LEVEL ATTACK TESTS${NC}"

echo "[14.1] HTTP Request Smuggling attempt"
printf "POST /api/auth/login HTTP/1.1\r\nHost: localhost:3000\r\nContent-Length: 4\r\n\r\nGET /api/users/me HTTP/1.1\r\nHost: localhost:3000\r\n\r\n" | nc localhost 3000

echo "[14.2] Slow HTTP attack (slowloris simulation)"
(echo -n "GET /api/movies/popular HTTP/1.1\r\nHost: localhost:3000\r\n"; sleep 30; echo "Connection: close\r\n\r\n") | nc localhost 3000 &
SLOW_PID=$!
sleep 2
kill $SLOW_PID 2>/dev/null

# ==========================================
# SUMMARY
# ==========================================
echo -e "\n${GREEN}======================================"
echo "TEST SUITE COMPLETED"
echo "======================================${NC}"
echo ""
echo "Review the output above for:"
echo "  - 500 errors (server crashes)"
echo "  - 200/201 responses where 400/401/403 expected"
echo "  - Detailed error messages exposing system info"
echo "  - SQL/NoSQL error messages"
echo "  - Successful unauthorized access"
echo "  - Missing rate limiting"
echo "  - Missing input validation"
echo ""
echo "Critical vulnerabilities to watch for:"
echo "  ✓ Authentication bypasses"
echo "  ✓ SQL/NoSQL injection"
echo "  ✓ XSS vulnerabilities"
echo "  ✓ IDOR (accessing other users' data)"
echo "  ✓ Path traversal"
echo "  ✓ Rate limiting absence"
echo "  ✓ File upload vulnerabilities"
echo "  ✓ Business logic flaws"
echo ""