#!/bin/bash

filename=Businesses.csv

function first()
{
        echo "Δώστε το path του αρχείου που επιθυμείτε σε περίπτωση που δεν επιθυμείτε να δώσετε κάποιο path τότε πατήστε enter για να επιλέξετε το default αρχείο Businesses"
        read filename
        if [ -z "$filename" ]; then
#an den doso file name
                echo "Έχετε επιλέξει το default αρχείο Businesses.csv"
                filename="Businesses.scv"
                directory=$(dirname "$(readlink -f "$filename")")
                echo "Το directory του Businesses.csv είναι: $directory"
        else
                echo "Έχετε επιλέξει το αρχείο $filename"
                directory=$(dirname "$(readlink -f "$filename")")
                echo "Tο directory του $filename είναι: $directory"
        fi
        return
}

function second()
{
        echo "Εισάγεται τον κωδικό της επιχείρησης, της οποίας επιθυμείτε
να μάθετε τα στοιχεία της"
        read busid

        echo "Τα στοιχεία της επιχείρησης με κωδικό $busid είναι: "
        sed -n "/$busid/p" "$filename"

        return
}

function third()
{
        echo "Εισάγεται τον κωδικό της επιχείρησης, στην οποία θέλετε να αλλάξετε κάποιο
στοιχείο"
        read busid
        while [ -z $busid ]; do
                echo "Δεν έχετε εισάγει κωδικό επιχείρησης, παρακαλώ εισάγεται έναν: "
                read busid
        done
        echo "Εισάγεται το στοιχείο το οποίο επιθυμείτε να αλλάξετε"
        read change
        while [ -z $change ]; do
                echo "Δεν έχετε εισάγει ποιο στοιχείο θέλετε να αλλάξετε, παρακαλώ εισάγεται
έναν: "
                read change
        done
        echo "Εισάγεται την νέα τιμή του στοιχείου"
        read new
        while [ -z $new ]; do
                echo "Δεν έχετε εισάγει το νέο στοιχείο, παρακαλώ εισάγεται ένα: "
              read new
       while [ -z $new ]; do
                echo "Δεν έχετε εισάγει το νέο στοιχείο, παρακαλώ εισάγεται ένα: "
              read new
        done

        echo Τα στοιχεία της επιχείρησης πριν την αλλαγή είναι:
        sed -n "/$busid/p" "$filename"


        echo Τα στοιχεία της επιχείρησης μετά την αλλαγή είναι:
        awk -v busid="$busid" -v change="$change" -v new="$new" \
        'BEGIN {FS=OFS=","} $1 == busid {modified=0; for (i=2; i<=NF; i++) {if ($i == change) $i = \
        new; modified=1} if (modified) print; next} 1'   "$filename" > tmpfile && mv tmpfile \
        "$filename"
        sed -n "/$busid/p" "$filename"
        return
}

function fourth(){
        echo "Στη συνέχεια θα εμφανιστούν τα περιεχόμενα του αρχείου Businesses.csv σε
περίπτωση που θέλετε να δείτε περισσότερα δεδομένα από ότι αυτά που ήδη έχουν εμφανιστεί
πατήστε Space"
        echo "Εάν θέλετε να σταματήσει η εμφάνισει δεδομένων πατήστε q"
        more "$filename"
}

function fifth() {
        echo "Εισάγεται το path του αρχείου στο οποίο θέλετε να αποθηκέυσετε το πελατολόγιο"
        read path
        if [ -z $path ]; then
                echo "Δεν έχετε επιλέξει κάποιο path. Το πελατολόγιο θα αποθηκευθεί στο αρχείο
Businesses.csv"
        path="$directory_path"
        echo "$direstory_path"
        fi

        cp "$filename" "$path"

        echo "Τα δεδομένα αποθηκεύτηκαν στο εξής path: $path"
        return
}

function six()
{
        exit
}

echo Μπορείτε να διαλέξετε μία από τις παρακάτω επιλογές:
echo Επιλέξτε 1 για επιλογή αρχείου επιχειρήσεων
echo Επιλέξτε 2 για προβολή στοιχείων επιχείρησης
echo Επιλέξτε 3 για αλλαγή στοιχείου επιχείρησης
echo Επιλέξτε 4 για προβολή αρχείου
echo Επιλέξτε 5 για αποθήκευση αρχείου
echo Επιλέξτε 6 για έξοδο
read Number

while [ "$Number" -le 0 -o "$Number" -ge 7 ]; do
        echo "Έχετε επιλέξει μία άκυρη επιλογή"
        echo "Μπορείτε να επιλέξετε εκ νέου μία από τις προαναφερθείσες
επιλογές"
        read Number
done

case $Number in
        "1")
        echo Έχετε επιλέξει την επιλογή 1
        first
        ;;
        "2")
        echo Έχετε επιλέξει την επιλογή 2
        second
        ;;
        "3")
        echo Έχετε επιλέξει την επιλογή 3
        third
        ;;
        "4")
        echo Έχετε επιλέξει την επιλογή 4
        fourth
        ;;
        "5")
        echo Έχετε επιλέξει την επιλογή 5
        fifth
        ;;
        "6")
        echo Έχετε επιλέξει την επιλογή 6
        echo Έξοδος...
        six
        ;;
esac

