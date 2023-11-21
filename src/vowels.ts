type Vowel = {
    Filename: string;
    Symbol: string;
    F1: number;
    F2: number;
    F3: number;
}

type LexicalSet = {
    Name: string;
    RP: Vowel[];
    GA: Vowel[];
    Examples: string[];
}