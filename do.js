const fdlst = () => {
    var data = [{ status: "paid" }, { status: "paid" }, { status: "paid" }, { status: "paid" }, { status: "paid", data: { nom: "Lonie" } },]
    console.log(data.findLast(e => e.status == "paid"));
}

fdlst();