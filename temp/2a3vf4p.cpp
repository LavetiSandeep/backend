#include <stdio.h>
int main() {
    int N, rev = 0;
    scanf("%d", &N);
    
    while (N > 0) {
        rev = rev * 10 + (N % 10);
        N /= 10;
    }
    printf("%d\n", rev);
    return 0;
}