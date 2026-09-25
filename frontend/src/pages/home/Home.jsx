import Sidebar from "../../components/sidebar/Sidebar";
import MessageContainer from "../../components/messages/MessageContainer";
import useConversation from "../../zustand/useConversation";

const Home = () => {
	const { selectedConversation } = useConversation();

	return (
		// Masaüstünde iki sütun; dar ekranda tek sütun: sohbet seçiliyse sohbet,
		// değilse liste görünür (mobil mesajlaşma uygulamalarındaki davranış).
		<div className='relay-workspace'>
			<div
				className={`${selectedConversation ? 'hidden' : 'flex'} md:flex w-full md:w-[320px] flex-shrink-0 flex-col min-h-0`}
				style={{ borderRight: '1px solid var(--border-subtle)' }}
			>
				<Sidebar />
			</div>

			<div className={`${selectedConversation ? 'flex' : 'hidden'} md:flex flex-1 min-w-0`}>
				<MessageContainer />
			</div>
		</div>
	);
};
export default Home;
